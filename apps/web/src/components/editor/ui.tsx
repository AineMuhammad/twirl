'use client';

import { type ReactNode, useId, useState } from 'react';

import { moneyInput, parseMoney } from './config-edit';

/*
 * The editor's UI kit: one place for sizes, colours and states so every form reads the same.
 * Text is 14–15px, controls are 40px tall, and every icon-only control has a label/tooltip.
 */

export const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

export const controlClass =
  'h-10 w-full rounded-lg border border-line bg-surface px-3 text-[15px] text-ink shadow-[0_1px_0_rgba(0,0,0,0.02)] outline-none transition-colors placeholder:text-ink-faint hover:border-ink-faint/50 focus:border-brand-500 focus:ring-3 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-60';

// ── Tooltips ───────────────────────────────────────────────────────────────────────────────

/**
 * A small "?" that explains a concept on hover or keyboard focus (and tap, which focuses it).
 * `align` keeps the bubble inside the panel near its edges.
 */
export function InfoTip({
  children,
  label = 'More information',
  align = 'start',
}: {
  children: ReactNode;
  label?: string;
  align?: 'start' | 'end' | 'center';
}) {
  const id = useId();
  const position =
    align === 'end' ? 'right-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0';
  return (
    <span className="group/tip relative inline-flex align-middle">
      <button
        type="button"
        aria-label={label}
        aria-describedby={id}
        className={`grid size-[18px] place-items-center rounded-full bg-tint-strong text-[11px] font-bold text-ink-muted transition-colors hover:bg-brand-100 hover:text-brand-700 dark:hover:bg-brand-500/25 dark:hover:text-brand-200 ${focusRing}`}
      >
        ?
      </button>
      <span
        role="tooltip"
        id={id}
        className={`pointer-events-none invisible absolute top-full z-40 mt-2 w-64 rounded-lg bg-ink px-3 py-2 text-[13px] leading-snug font-normal text-surface opacity-0 shadow-lg transition-opacity group-focus-within/tip:visible group-focus-within/tip:opacity-100 group-hover/tip:visible group-hover/tip:opacity-100 ${position}`}
      >
        {children}
      </span>
    </span>
  );
}

// ── Layout ─────────────────────────────────────────────────────────────────────────────────

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
        <p className="mt-1 text-[14px] leading-relaxed text-ink-muted">{description}</p>
      </div>
      {action}
    </header>
  );
}

/** A labelled group of fields inside a card. */
export function Subsection({
  title,
  help,
  children,
}: {
  title: string;
  help?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h4 className="flex items-center gap-2 text-[13px] font-semibold tracking-wide text-ink-soft uppercase">
        {title}
        {help && <InfoTip label={`About ${title.toLowerCase()}`}>{help}</InfoTip>}
      </h4>
      {children}
    </section>
  );
}

export function Callout({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'warning' | 'danger';
  children: ReactNode;
}) {
  const tones = {
    info: 'bg-brand-50 text-brand-900 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-100 dark:ring-brand-500/25',
    warning:
      'bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-100 dark:ring-amber-500/25',
    danger:
      'bg-red-50 text-red-800 ring-red-200 dark:bg-red-500/10 dark:text-red-200 dark:ring-red-500/25',
  };
  return (
    <div className={`rounded-xl px-4 py-3 text-[14px] leading-relaxed ring-1 ${tones[tone]}`}>
      {children}
    </div>
  );
}

export type Tone = 'neutral' | 'brand' | 'violet' | 'sky' | 'amber' | 'rose' | 'emerald' | 'red';

const BADGE_TONES: Record<Tone, string> = {
  neutral: 'bg-tint-strong text-ink-soft',
  brand: 'bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200',
  violet: 'bg-violet-50 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200',
  sky: 'bg-sky-50 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200',
  amber: 'bg-amber-50 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200',
  rose: 'bg-rose-50 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
  red: 'bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-200',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium whitespace-nowrap ${BADGE_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

// ── Buttons ────────────────────────────────────────────────────────────────────────────────

const BUTTON_VARIANTS = {
  primary:
    'bg-brand-600 text-white shadow-sm hover:bg-brand-700 disabled:bg-brand-600/50 disabled:shadow-none',
  secondary: 'border border-line bg-surface text-ink shadow-sm hover:bg-tint',
  ghost: 'text-ink-soft hover:bg-tint hover:text-ink',
  danger: 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  children,
  title,
  ...props
}: {
  variant?: keyof typeof BUTTON_VARIANTS;
  size?: 'sm' | 'md';
  children: ReactNode;
  title?: string | undefined;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'>) {
  const sizes = size === 'sm' ? 'h-8 px-2.5 text-[13px] gap-1.5' : 'h-10 px-4 text-[14px] gap-2';
  return (
    <button
      type="button"
      title={title}
      {...props}
      className={`inline-flex shrink-0 items-center justify-center rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${sizes} ${BUTTON_VARIANTS[variant]} ${focusRing}`}
    >
      {children}
    </button>
  );
}

/** An icon-only button; `label` is both its accessible name and its tooltip. */
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
      className={`grid size-9 shrink-0 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-tint disabled:opacity-30 disabled:hover:bg-transparent ${tone === 'danger' ? 'hover:text-red-600' : 'hover:text-ink'} ${focusRing}`}
    >
      {children}
    </button>
  );
}

// ── Fields ─────────────────────────────────────────────────────────────────────────────────

export function Field({
  label,
  help,
  hint,
  error,
  children,
}: {
  label: string;
  /** Tooltip text next to the label. */
  help?: ReactNode;
  /** Always-visible helper text under the control. */
  hint?: ReactNode;
  error?: string | undefined;
  children: (id: string, describedBy: string | undefined) => ReactNode;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="text-[14px] font-medium text-ink">
          {label}
        </label>
        {help && <InfoTip label={`About ${label.toLowerCase()}`}>{help}</InfoTip>}
      </div>
      {children(id, hint || error ? hintId : undefined)}
      {error ? (
        <p id={hintId} className="text-[13px] text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : (
        hint && (
          <p id={hintId} className="text-[13px] leading-snug text-ink-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  help,
  hint,
  error,
  placeholder,
  maxLength = 80,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  help?: ReactNode;
  hint?: ReactNode;
  error?: string | undefined;
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
}) {
  return (
    <Field label={label} help={help} hint={hint} error={error}>
      {(id, describedBy) =>
        multiline ? (
          <textarea
            id={id}
            aria-describedby={describedBy}
            className={`${controlClass} h-auto min-h-20 resize-y py-2 leading-relaxed`}
            value={value}
            maxLength={maxLength}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <input
            id={id}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            className={`${controlClass} ${error ? 'border-red-400' : ''}`}
            value={value}
            maxLength={maxLength}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        )
      }
    </Field>
  );
}

/** The currency's symbol ("$", "€"), falling back to its code. */
export function currencySymbol(currency: string) {
  try {
    return (
      new Intl.NumberFormat('en-US', { style: 'currency', currency })
        .formatToParts(0)
        .find((p) => p.type === 'currency')?.value ?? currency
    );
  } catch {
    return currency;
  }
}

/** A bare price input (no label) in major units, stored as minor units. */
export function MoneyInput({
  value,
  currency,
  onChange,
  allowNegative = true,
  ariaLabel,
  id,
  describedBy,
}: {
  value: number;
  currency: string;
  onChange: (minor: number) => void;
  allowNegative?: boolean;
  ariaLabel?: string;
  id?: string;
  describedBy?: string | undefined;
}) {
  const [text, setText] = useState(() => moneyInput(value));
  const [editing, setEditing] = useState(false);
  return (
    <div className="flex h-10 items-center rounded-lg border border-line bg-surface transition-colors focus-within:border-brand-500 focus-within:ring-3 focus-within:ring-brand-500/20 hover:border-ink-faint/50">
      <span className="pl-3 text-[14px] text-ink-muted">{currencySymbol(currency)}</span>
      <input
        id={id}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        inputMode="decimal"
        className="h-full w-full min-w-0 bg-transparent px-2 text-[15px] text-ink tabular-nums outline-none"
        value={editing ? text : moneyInput(value)}
        onFocus={(e) => {
          setText(moneyInput(value));
          setEditing(true);
          e.target.select();
        }}
        onBlur={() => setEditing(false)}
        onChange={(e) => {
          setText(e.target.value);
          const minor = parseMoney(e.target.value);
          if (minor !== null && (allowNegative || minor >= 0)) onChange(minor);
        }}
      />
    </div>
  );
}

export function MoneyField({
  label,
  help,
  hint,
  ...input
}: {
  label: string;
  help?: ReactNode;
  hint?: ReactNode;
  value: number;
  currency: string;
  onChange: (minor: number) => void;
  allowNegative?: boolean;
}) {
  return (
    <Field label={label} help={help} hint={hint}>
      {(id, describedBy) => <MoneyInput {...input} id={id} describedBy={describedBy} />}
    </Field>
  );
}

/** A number input that commits valid numbers as you type and resets on blur. */
export function NumberField({
  label,
  value,
  onChange,
  help,
  hint,
  suffix,
  min,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  help?: ReactNode;
  hint?: ReactNode;
  suffix?: string;
  min?: number;
}) {
  const [text, setText] = useState(String(value));
  const [editing, setEditing] = useState(false);
  return (
    <Field label={label} help={help} hint={hint}>
      {(id, describedBy) => (
        <div className="flex h-10 items-center rounded-lg border border-line bg-surface transition-colors focus-within:border-brand-500 focus-within:ring-3 focus-within:ring-brand-500/20 hover:border-ink-faint/50">
          <input
            id={id}
            aria-describedby={describedBy}
            inputMode="decimal"
            className="h-full w-full min-w-0 bg-transparent px-3 text-[15px] text-ink tabular-nums outline-none"
            value={editing ? text : String(value)}
            onFocus={(e) => {
              setText(String(value));
              setEditing(true);
              e.target.select();
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
          {suffix && <span className="pr-3 text-[14px] text-ink-muted">{suffix}</span>}
        </div>
      )}
    </Field>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  help,
  hint,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  help?: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <Field label={label} help={help} hint={hint}>
      {(id, describedBy) => (
        <select
          id={id}
          aria-describedby={describedBy}
          className={`${controlClass} pr-8`}
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

/** A colour well (opens the system picker) plus an editable hex code. */
export function ColorInput({
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
    <div className="flex items-center gap-2">
      <label
        className={`relative size-10 shrink-0 cursor-pointer overflow-hidden rounded-lg shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)] ${focusRing} focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-600`}
        style={{ background: value }}
        title={`Pick ${label.toLowerCase()}`}
      >
        <input
          type="color"
          aria-label={`Pick ${label.toLowerCase()}`}
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </label>
      <input
        aria-label={`${label} hex code`}
        className={`${controlClass} w-[6.5rem] font-mono text-[14px] uppercase`}
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

/** An on/off switch with a visible label and optional explanation. */
export function Toggle({
  label,
  description,
  help,
  checked,
  onChange,
}: {
  label: string;
  description?: ReactNode;
  help?: ReactNode;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <label htmlFor={id} className="cursor-pointer text-[14px] font-medium text-ink">
            {label}
          </label>
          {help && <InfoTip label={`About ${label.toLowerCase()}`}>{help}</InfoTip>}
        </div>
        {description && <p className="mt-0.5 text-[13px] text-ink-muted">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${checked ? 'bg-brand-600' : 'bg-tint-strong'} ${focusRing}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-5' : ''}`}
        />
      </button>
    </div>
  );
}

/** Pill-shaped multi-select toggles (e.g. which parts an option applies to). */
export function ChipToggle({
  selected,
  disabled,
  title,
  onClick,
  children,
}: {
  selected: boolean;
  disabled?: boolean | undefined;
  title?: string | undefined;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[14px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${selected ? 'border-brand-500 bg-brand-50 text-brand-800 dark:bg-brand-500/15 dark:text-brand-100' : 'border-line bg-surface text-ink-soft hover:border-ink-faint/60 hover:text-ink'} ${focusRing}`}
    >
      {selected && (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          aria-hidden
        >
          <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {children}
    </button>
  );
}

/** A segmented single choice (e.g. Stretch / Move / Fixed). */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string; title?: string | undefined }[];
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex rounded-lg bg-tint-strong p-0.5"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={`h-8 rounded-md px-3 text-[13px] font-medium transition-all ${active ? 'bg-surface text-ink shadow-sm dark:bg-white/15' : 'text-ink-muted hover:text-ink'} ${focusRing}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
