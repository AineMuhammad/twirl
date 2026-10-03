'use client';

import { type ReactNode, useId, useState } from 'react';

import { moneyInput, parseMoney } from './config-edit';

export const inputClass =
  'w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20';

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-xs font-medium text-ink-soft">
        {label}
      </label>
      {children(id)}
      {hint && <p className="text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  placeholder,
  maxLength = 80,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <Field label={label} {...(hint && { hint })}>
      {(id) => (
        <input
          id={id}
          className={inputClass}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Field>
  );
}

/**
 * A price in major units ("49.50") stored as minor units. Typing is free-form; the value commits
 * whenever the text is a valid amount, and resets to the last valid amount on blur.
 */
export function MoneyField({
  label,
  value,
  currency,
  onChange,
  allowNegative = true,
}: {
  label: string;
  value: number;
  currency: string;
  onChange: (minor: number) => void;
  allowNegative?: boolean;
}) {
  const [text, setText] = useState(() => moneyInput(value));
  const [editing, setEditing] = useState(false);
  const shown = editing ? text : moneyInput(value);
  return (
    <Field label={label}>
      {(id) => (
        <div className="flex items-center rounded-lg border border-line bg-surface focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
          <span className="pl-2.5 text-xs text-ink-faint">{currency}</span>
          <input
            id={id}
            inputMode="decimal"
            className="w-full bg-transparent px-2 py-1.5 text-sm text-ink tabular-nums outline-none"
            value={shown}
            onFocus={() => {
              setText(moneyInput(value));
              setEditing(true);
            }}
            onBlur={() => setEditing(false)}
            onChange={(e) => {
              setText(e.target.value);
              const minor = parseMoney(e.target.value);
              if (minor !== null && (allowNegative || minor >= 0)) onChange(minor);
            }}
          />
        </div>
      )}
    </Field>
  );
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const [text, setText] = useState(value);
  const [editing, setEditing] = useState(false);
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="color"
        aria-label={`${label} colour`}
        value={value}
        onChange={(e) => onChange(e.target.value.toLowerCase())}
        className="size-8 shrink-0 cursor-pointer rounded-md border border-line bg-surface p-0.5"
      />
      <input
        aria-label={`${label} hex`}
        className={`${inputClass} w-24 font-mono uppercase`}
        value={editing ? text : value}
        maxLength={7}
        onFocus={() => {
          setText(value);
          setEditing(true);
        }}
        onBlur={() => setEditing(false)}
        onChange={(e) => {
          const next = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`;
          setText(next);
          if (/^#[0-9a-f]{6}$/i.test(next)) onChange(next.toLowerCase());
        }}
      />
    </div>
  );
}

export function IconButton({
  label,
  onClick,
  disabled,
  children,
  tone = 'default',
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
  tone?: 'default' | 'danger';
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`grid size-7 shrink-0 place-items-center rounded-md text-ink-muted hover:bg-tint focus-visible:outline-2 focus-visible:outline-brand-600 disabled:opacity-30 disabled:hover:bg-transparent ${tone === 'danger' ? 'hover:text-red-600' : 'hover:text-ink'}`}
    >
      {children}
    </button>
  );
}

/** A number input that commits valid numbers as you type and resets on blur. */
export function NumberField({
  label,
  value,
  onChange,
  hint,
  min,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
  min?: number;
}) {
  const [text, setText] = useState(String(value));
  const [editing, setEditing] = useState(false);
  return (
    <Field label={label} {...(hint && { hint })}>
      {(id) => (
        <input
          id={id}
          inputMode="decimal"
          className={`${inputClass} tabular-nums`}
          value={editing ? text : String(value)}
          onFocus={() => {
            setText(String(value));
            setEditing(true);
          }}
          onBlur={() => setEditing(false)}
          onChange={(e) => {
            setText(e.target.value);
            const n = Number(e.target.value);
            if (
              e.target.value.trim() !== '' &&
              Number.isFinite(n) &&
              (min === undefined || n >= min)
            ) {
              onChange(n);
            }
          }}
        />
      )}
    </Field>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  hint?: string;
}) {
  return (
    <Field label={label} {...(hint && { hint })}>
      {(id) => (
        <select
          id={id}
          className={inputClass}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}
