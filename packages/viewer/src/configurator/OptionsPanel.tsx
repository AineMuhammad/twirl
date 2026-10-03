'use client';

import {
  type ColorGroup,
  type DimensionGroup,
  type Evaluation,
  formatPrice,
  type GroupAvailability,
  optionIdOf,
  type ProductConfig,
  type SelectionValue,
  type VisibilityGroup,
} from '@twirl/config-schema/engine';
import { useId, useState } from 'react';

import { ColorPicker } from '../ui/ColorPicker';
import { CheckIcon, ChevronIcon } from '../ui/icons';
import { focusRing, RAINBOW } from '../ui/ui';
import { colorFor } from './config-overrides';

export interface OptionsPanelProps {
  config: ProductConfig;
  evaluation: Evaluation;
  onChange: (group: string, value: SelectionValue) => void;
  /** Extra classes for the list (e.g. a grid in wide layouts). */
  className?: string;
}

const CHECKER = 'repeating-conic-gradient(#e5e5e5 0 25%, #fff 0 50%) 50% / 8px 8px';
const NO_STATE: GroupAvailability = { hidden: false, disabled: false, options: {} };

function isLight(hex: string) {
  const n = Number.parseInt(hex.slice(1), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 160;
}

/** "+$60.00" for a surcharge, "" when the option is free. */
function priceDelta(amount: number, currency: string) {
  if (amount === 0) return '';
  return `${amount > 0 ? '+' : '−'}${formatPrice(Math.abs(amount), currency)}`;
}

/**
 * One control per option group, in config order: colour groups as expandable swatch cards,
 * visibility groups as switches, dimension groups as sliders. Hidden groups and options are
 * left out; disabled ones stay visible with the rule's reason.
 */
export function OptionsPanel({ config, evaluation, onChange, className = '' }: OptionsPanelProps) {
  const firstColor = config.groups.find((g) => g.type === 'color')?.id ?? null;
  const [openId, setOpenId] = useState<string | null>(firstColor);
  const currency = config.pricing.currency;

  return (
    <ul className={`space-y-2 px-5 pb-6 ${className}`} aria-label="Options">
      {config.groups.map((group) => {
        const state = evaluation.availability[group.id] ?? NO_STATE;
        if (state.hidden) return null;
        const value = evaluation.selections[group.id];
        return (
          <li key={group.id}>
            {group.type === 'color' ? (
              <ColorCard
                group={group}
                value={value}
                state={state}
                currency={currency}
                color={colorFor(config, group.id, value)}
                open={openId === group.id}
                onToggle={() => setOpenId(openId === group.id ? null : group.id)}
                onChange={(v) => onChange(group.id, v)}
              />
            ) : group.type === 'visibility' ? (
              <VisibilityRow
                group={group}
                value={value === true}
                state={state}
                currency={currency}
                onChange={(v) => onChange(group.id, v)}
              />
            ) : (
              <DimensionRow
                group={group}
                value={typeof value === 'number' ? value : group.default}
                state={state}
                currency={currency}
                onChange={(v) => onChange(group.id, v)}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Reason({ text }: { text: string | undefined }) {
  if (!text) return null;
  return <span className="mt-1 block text-xs text-amber-700 dark:text-amber-400">{text}</span>;
}

const cardClass = (open: boolean, disabled: boolean) =>
  `rounded-2xl border bg-surface transition-shadow ${disabled ? 'opacity-60' : ''} ${open ? 'border-brand-200 shadow-[0_0_0_3px_var(--color-brand-100)] dark:border-brand-500/60 dark:shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-brand-500)_25%,transparent)]' : 'border-line hover:border-ink-faint/40'}`;

function ColorCard({
  group,
  value,
  state,
  currency,
  color,
  open,
  onToggle,
  onChange,
}: {
  group: ColorGroup;
  value: SelectionValue | undefined;
  state: GroupAvailability;
  currency: string;
  color: string | undefined;
  open: boolean;
  onToggle: () => void;
  onChange: (value: SelectionValue) => void;
}) {
  const [customOpen, setCustomOpen] = useState(false);
  const panelId = useId();
  const selected = optionIdOf(value);
  const swatch = group.swatches.find((s) => s.id === selected);
  const isCustom = selected === 'custom';
  const current = isCustom
    ? { label: 'Custom', price: group.customPrice }
    : (swatch ?? { label: group.originalLabel, price: 0 });
  const optionState = (id: string) => state.options[id] ?? { hidden: false, disabled: false };
  const custom = optionState('custom');

  const options = [
    { id: 'original', label: group.originalLabel, color: undefined, price: 0 },
    ...group.swatches,
  ].filter((o) => !optionState(o.id).hidden);

  return (
    <div className={cardClass(open, state.disabled)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        disabled={state.disabled}
        onClick={() => {
          onToggle();
          setCustomOpen(false);
        }}
        className={`flex w-full items-center gap-3 rounded-2xl py-3 pr-3 pl-3 text-left ${focusRing}`}
      >
        <span
          aria-hidden
          className="size-8 shrink-0 rounded-xl shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)]"
          style={{ background: color ?? CHECKER }}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ink">{group.label}</span>
          <span className="block truncate text-xs text-ink-muted">
            {current.label}
            {current.price !== 0 && ` · ${priceDelta(current.price, currency)}`}
          </span>
          <Reason text={state.disabled ? state.reason : undefined} />
        </span>
        <ChevronIcon
          className={`shrink-0 text-ink-faint transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        />
      </button>

      {open && !state.disabled && (
        <div id={panelId} className="border-t border-line px-3 pt-3 pb-3">
          {group.description && <p className="mb-3 text-xs text-ink-muted">{group.description}</p>}
          <div role="group" aria-label={group.label} className="grid grid-cols-6 gap-2">
            {options.map((option) => {
              const active = selected === option.id;
              const os = optionState(option.id);
              const name = [option.label, priceDelta(option.price, currency), os.reason]
                .filter(Boolean)
                .join(' · ');
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-label={name}
                  aria-pressed={active}
                  title={name}
                  disabled={os.disabled}
                  onClick={() => {
                    onChange(option.id);
                    setCustomOpen(false);
                  }}
                  className={`grid aspect-square place-items-center rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] transition-transform duration-150 enabled:hover:scale-110 disabled:cursor-not-allowed disabled:opacity-30 ${focusRing} ${active ? 'ring-2 ring-brand-600 ring-offset-2 ring-offset-surface' : ''}`}
                  style={{ background: option.color ?? CHECKER }}
                >
                  {active && (
                    <CheckIcon
                      width={14}
                      height={14}
                      className={!option.color || isLight(option.color) ? 'text-ink' : 'text-white'}
                    />
                  )}
                </button>
              );
            })}
            {group.allowCustom && !custom.hidden && (
              <button
                type="button"
                aria-label={['Custom color', priceDelta(group.customPrice, currency)]
                  .filter(Boolean)
                  .join(' · ')}
                aria-expanded={customOpen}
                aria-pressed={isCustom}
                title={custom.reason ?? 'Custom color'}
                disabled={custom.disabled}
                onClick={() => setCustomOpen((v) => !v)}
                className={`grid aspect-square place-items-center rounded-full transition-transform duration-150 enabled:hover:scale-110 disabled:opacity-30 ${focusRing} ${isCustom || customOpen ? 'ring-2 ring-brand-600 ring-offset-2 ring-offset-surface' : ''}`}
                style={{ background: isCustom ? color : RAINBOW }}
              >
                {!isCustom && (
                  <span
                    aria-hidden
                    className="text-base leading-none font-semibold text-white drop-shadow"
                  >
                    +
                  </span>
                )}
              </button>
            )}
          </div>
          {customOpen && (
            <ColorPicker
              label={group.label}
              color={color ?? '#4f46e5'}
              onChange={(hex) => onChange({ custom: hex.toLowerCase() })}
              onDone={() => setCustomOpen(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

function VisibilityRow({
  group,
  value,
  state,
  currency,
  onChange,
}: {
  group: VisibilityGroup;
  value: boolean;
  state: GroupAvailability;
  currency: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      disabled={state.disabled}
      onClick={() => onChange(!value)}
      className={`${cardClass(false, state.disabled)} flex w-full items-center justify-between gap-4 px-4 py-3 text-left ${focusRing}`}
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink">{group.label}</span>
        <span className="block text-xs text-ink-muted">
          {group.description ?? (value ? 'Included' : 'Not included')}
          {group.price !== 0 && ` · ${priceDelta(group.price, currency)}`}
        </span>
        <Reason text={state.disabled ? state.reason : undefined} />
      </span>
      <span
        aria-hidden
        className={`relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200 ${value ? 'bg-brand-600' : 'bg-tint-strong'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-surface shadow-sm transition-transform duration-200 ${value ? 'translate-x-4' : ''}`}
        />
      </span>
    </button>
  );
}

function DimensionRow({
  group,
  value,
  state,
  currency,
  onChange,
}: {
  group: DimensionGroup;
  value: number;
  state: GroupAvailability;
  currency: string;
  onChange: (value: number) => void;
}) {
  const id = useId();
  const delta = Math.round((value - group.default) / group.step) * group.pricePerStep;
  return (
    <div className={`${cardClass(false, state.disabled)} px-4 py-3`}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {group.label}
        </label>
        <span className="text-sm text-ink tabular-nums">
          {value} {group.unit}
          {delta !== 0 && (
            <span className="ml-1.5 text-xs text-ink-muted">{priceDelta(delta, currency)}</span>
          )}
        </span>
      </div>
      {group.description && <p className="mt-0.5 text-xs text-ink-muted">{group.description}</p>}
      <input
        id={id}
        type="range"
        min={group.min}
        max={group.max}
        step={group.step}
        value={value}
        disabled={state.disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full accent-brand-600"
      />
      <div className="mt-1 flex justify-between text-xs text-ink-faint tabular-nums">
        <span>
          {group.min} {group.unit}
        </span>
        <span>
          {group.max} {group.unit}
        </span>
      </div>
      <Reason text={state.disabled ? state.reason : undefined} />
    </div>
  );
}
