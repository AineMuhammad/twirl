'use client';

import type {
  ColorGroup,
  DimensionGroup,
  OptionGroup,
  ProductConfig,
  VisibilityGroup,
} from '@twirl/config-schema/engine';
import { Switch } from '@twirl/viewer/ui';
import { useState } from 'react';

import {
  addColorGroup,
  addDimensionGroup,
  addSwatch,
  addVisibilityGroup,
  coloredParts,
  moveGroup,
  removeGroup,
  removeSwatch,
  updateGroup,
} from './config-edit';
import {
  ColorField,
  Field,
  IconButton,
  inputClass,
  MoneyField,
  NumberField,
  SelectField,
  TextField,
} from './fields';
import { DownIcon, PlusIcon, TrashIcon, UpIcon } from './icons';

export interface OptionsEditorProps {
  config: ProductConfig;
  onChange: (config: ProductConfig) => void;
}

const TYPE_LABELS: Record<OptionGroup['type'], string> = {
  color: 'Colour',
  visibility: 'Show / hide',
  dimension: 'Size',
};

/** The choices shoppers get, in the order they appear in the configurator. */
export function OptionsEditor({ config, onChange }: OptionsEditorProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const uncolored = config.parts.filter((p) => !coloredParts(config).has(p.id));
  const firstPart = config.parts[0];

  const add = (type: OptionGroup['type']) => {
    const part = type === 'color' ? uncolored[0] : firstPart;
    if (!part) return;
    const next =
      type === 'color'
        ? addColorGroup(config, `${part.label} colour`, [part.id])
        : type === 'visibility'
          ? addVisibilityGroup(config, part.label, [part.id])
          : addDimensionGroup(config, 'Width', [part.id]);
    onChange(next);
    setOpenId(next.groups.at(-1)?.id ?? null);
  };

  return (
    <div className="space-y-4 p-5">
      <ul className="space-y-2" aria-label="Options">
        {config.groups.map((group, index) => {
          const open = openId === group.id;
          const update = <G extends OptionGroup>(fn: (g: G) => G) =>
            onChange(updateGroup<G>(config, group.id, fn));
          return (
            <li key={group.id} className="rounded-xl border border-line bg-surface">
              <div className="flex items-center gap-1 p-2 pl-3">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : group.id)}
                  className="min-w-0 flex-1 rounded-md py-1 text-left focus-visible:outline-2 focus-visible:outline-brand-600"
                >
                  <span className="block truncate text-sm font-medium text-ink">{group.label}</span>
                  <span className="block text-xs text-ink-muted">{TYPE_LABELS[group.type]}</span>
                </button>
                <IconButton
                  label={`Move ${group.label} up`}
                  disabled={index === 0}
                  onClick={() => onChange(moveGroup(config, group.id, -1))}
                >
                  <UpIcon />
                </IconButton>
                <IconButton
                  label={`Move ${group.label} down`}
                  disabled={index === config.groups.length - 1}
                  onClick={() => onChange(moveGroup(config, group.id, 1))}
                >
                  <DownIcon />
                </IconButton>
                <IconButton
                  label={`Remove ${group.label}`}
                  tone="danger"
                  onClick={() => onChange(removeGroup(config, group.id))}
                >
                  <TrashIcon />
                </IconButton>
              </div>
              {open && (
                <div className="space-y-4 border-t border-line p-3">
                  <TextField
                    label="Name shown to shoppers"
                    value={group.label}
                    onChange={(label) => update((g) => ({ ...g, label }))}
                  />
                  <TextField
                    label="Description (optional)"
                    value={group.description ?? ''}
                    maxLength={240}
                    onChange={(text) =>
                      update((g) => {
                        const { description: _, ...rest } = g;
                        return (text ? { ...rest, description: text } : rest) as typeof g;
                      })
                    }
                  />
                  {group.type === 'color' && (
                    <ColorGroupFields config={config} group={group} update={update} />
                  )}
                  {group.type === 'visibility' && (
                    <VisibilityGroupFields config={config} group={group} update={update} />
                  )}
                  {group.type === 'dimension' && (
                    <DimensionGroupFields config={config} group={group} update={update} />
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!uncolored[0]}
          title={uncolored[0] ? undefined : 'Every part already has a colour option'}
          onClick={() => add('color')}
          className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-tint disabled:opacity-40"
        >
          <PlusIcon /> Colour option
        </button>
        <button
          type="button"
          disabled={!firstPart}
          onClick={() => add('visibility')}
          className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-tint disabled:opacity-40"
        >
          <PlusIcon /> Show / hide option
        </button>
        <button
          type="button"
          disabled={!firstPart}
          onClick={() => add('dimension')}
          className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-tint disabled:opacity-40"
        >
          <PlusIcon /> Size option
        </button>
      </div>
    </div>
  );
}

type Update<G> = (fn: (g: G) => G) => void;

function PartsPicker({
  config,
  selected,
  disabledParts,
  onChange,
}: {
  config: ProductConfig;
  selected: string[];
  /** Part id → why it can't be picked. */
  disabledParts?: Map<string, string>;
  onChange: (parts: string[]) => void;
}) {
  return (
    <fieldset>
      <legend className="text-xs font-medium text-ink-soft">Parts</legend>
      <div className="mt-1 space-y-1">
        {config.parts.map((part) => {
          const checked = selected.includes(part.id);
          const reason = disabledParts?.get(part.id);
          // Keep at least one part selected.
          const locked = checked && selected.length === 1;
          return (
            <label
              key={part.id}
              className={`flex items-center gap-2 text-sm ${reason ? 'text-ink-faint' : 'text-ink'}`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={Boolean(reason) || locked}
                onChange={() =>
                  onChange(checked ? selected.filter((p) => p !== part.id) : [...selected, part.id])
                }
                className="accent-brand-600"
              />
              {part.label}
              {reason && <span className="text-xs">({reason})</span>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function ColorGroupFields({
  config,
  group,
  update,
}: {
  config: ProductConfig;
  group: ColorGroup;
  update: Update<ColorGroup>;
}) {
  const currency = config.pricing.currency;
  const takenBy = new Map<string, string>();
  for (const g of config.groups) {
    if (g.type === 'color' && g.id !== group.id) {
      for (const p of g.parts) takenBy.set(p, `in ${g.label}`);
    }
  }
  return (
    <>
      <PartsPicker
        config={config}
        selected={group.parts}
        disabledParts={takenBy}
        onChange={(parts) => update((g) => ({ ...g, parts }))}
      />
      <TextField
        label="Name of the model's own finish"
        hint="Shown as the first choice, e.g. “Natural oak”."
        value={group.originalLabel}
        onChange={(originalLabel) => update((g) => ({ ...g, originalLabel }))}
      />
      <fieldset className="space-y-2">
        <legend className="text-xs font-medium text-ink-soft">Swatches</legend>
        {group.swatches.map((swatch) => (
          <div key={swatch.id} className="space-y-2 rounded-lg bg-tint p-2">
            <div className="flex items-center gap-1.5">
              <ColorField
                label={swatch.label}
                value={swatch.color}
                onChange={(color) =>
                  update((g) => ({
                    ...g,
                    swatches: g.swatches.map((s) => (s.id === swatch.id ? { ...s, color } : s)),
                  }))
                }
              />
              <input
                aria-label="Swatch name"
                className={inputClass}
                value={swatch.label}
                maxLength={80}
                onChange={(e) =>
                  update((g) => ({
                    ...g,
                    swatches: g.swatches.map((s) =>
                      s.id === swatch.id ? { ...s, label: e.target.value } : s,
                    ),
                  }))
                }
              />
              <IconButton
                label={`Remove ${swatch.label}`}
                tone="danger"
                disabled={group.swatches.length === 1}
                onClick={() => update((g) => removeSwatch(g, swatch.id))}
              >
                <TrashIcon />
              </IconButton>
            </div>
            <MoneyField
              label="Price change"
              currency={currency}
              value={swatch.price}
              onChange={(price) =>
                update((g) => ({
                  ...g,
                  swatches: g.swatches.map((s) => (s.id === swatch.id ? { ...s, price } : s)),
                }))
              }
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => update(addSwatch)}
          className="flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline dark:text-brand-200"
        >
          <PlusIcon width={12} height={12} /> Add swatch
        </button>
      </fieldset>
      <Field label="Default">
        {(id) => (
          <select
            id={id}
            className={inputClass}
            value={group.default ?? ''}
            onChange={(e) => update((g) => ({ ...g, default: e.target.value || null }))}
          >
            <option value="">{group.originalLabel} (model&apos;s finish)</option>
            {group.swatches.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Switch
        label="Allow any colour"
        description="Shoppers can pick a colour of their own."
        checked={group.allowCustom}
        onChange={(allowCustom) => update((g) => ({ ...g, allowCustom }))}
      />
      {group.allowCustom && (
        <MoneyField
          label="Custom colour price change"
          currency={currency}
          value={group.customPrice}
          onChange={(customPrice) => update((g) => ({ ...g, customPrice }))}
        />
      )}
    </>
  );
}

function VisibilityGroupFields({
  config,
  group,
  update,
}: {
  config: ProductConfig;
  group: VisibilityGroup;
  update: Update<VisibilityGroup>;
}) {
  return (
    <>
      <PartsPicker
        config={config}
        selected={group.parts}
        onChange={(parts) => update((g) => ({ ...g, parts }))}
      />
      <Switch
        label="Shown by default"
        checked={group.default}
        onChange={(value) => update((g) => ({ ...g, default: value }))}
      />
      <MoneyField
        label="Price while shown"
        currency={config.pricing.currency}
        value={group.price}
        onChange={(price) => update((g) => ({ ...g, price }))}
      />
    </>
  );
}

const UNIT_OPTIONS = [
  { value: 'mm', label: 'Millimetres (mm)' },
  { value: 'cm', label: 'Centimetres (cm)' },
  { value: 'm', label: 'Metres (m)' },
  { value: 'in', label: 'Inches (in)' },
] as const;

const AXIS_LABELS = { x: 'Width (x)', y: 'Height (y)', z: 'Depth (z)' } as const;

function DimensionGroupFields({
  config,
  group,
  update,
}: {
  config: ProductConfig;
  group: DimensionGroup;
  update: Update<DimensionGroup>;
}) {
  const modeOf = (part: string) => group.behaviors.find((b) => b.part === part)?.mode ?? 'fixed';
  const setMode = (part: string, mode: 'stretch' | 'anchor' | 'fixed') =>
    update((g) => {
      const others = g.behaviors.filter((b) => b.part !== part);
      return { ...g, behaviors: mode === 'fixed' ? others : [...others, { part, mode }] };
    });
  return (
    <>
      <SelectField
        label="Unit"
        value={group.unit}
        options={UNIT_OPTIONS}
        onChange={(unit) => update((g) => ({ ...g, unit }))}
      />
      <div className="grid grid-cols-2 gap-2">
        <NumberField
          label="Minimum"
          value={group.min}
          min={0}
          onChange={(min) => update((g) => ({ ...g, min }))}
        />
        <NumberField
          label="Maximum"
          value={group.max}
          min={0}
          onChange={(max) => update((g) => ({ ...g, max }))}
        />
        <NumberField
          label="Step"
          value={group.step}
          min={0}
          onChange={(step) => update((g) => ({ ...g, step }))}
        />
        <NumberField
          label="Default"
          value={group.default}
          min={0}
          onChange={(value) => update((g) => ({ ...g, default: value }))}
        />
      </div>
      <NumberField
        label={`Model's actual size (${group.unit})`}
        hint="How big the uploaded model is along the chosen directions. Sizes scale relative to this."
        value={group.nativeSize}
        min={0}
        onChange={(nativeSize) => update((g) => ({ ...g, nativeSize }))}
      />
      <fieldset>
        <legend className="text-xs font-medium text-ink-soft">Directions</legend>
        <div className="mt-1 flex gap-3">
          {(['x', 'y', 'z'] as const).map((axis) => {
            const checked = group.axes.includes(axis);
            return (
              <label key={axis} className="flex items-center gap-1.5 text-sm text-ink">
                <input
                  type="checkbox"
                  className="accent-brand-600"
                  checked={checked}
                  disabled={checked && group.axes.length === 1}
                  onChange={() =>
                    update((g) => ({
                      ...g,
                      axes: checked ? g.axes.filter((a) => a !== axis) : [...g.axes, axis],
                    }))
                  }
                />
                {AXIS_LABELS[axis]}
              </label>
            );
          })}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-xs font-medium text-ink-soft">How each part responds</legend>
        <p className="text-xs text-ink-faint">
          Stretch: resizes. Move: keeps its size and stays attached (legs, cushions). Fixed:
          unaffected.
        </p>
        <div className="mt-2 space-y-1.5">
          {config.parts.map((part) => (
            <div key={part.id} className="flex items-center gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate text-ink">{part.label}</span>
              <select
                aria-label={`How ${part.label} responds`}
                className={`${inputClass} w-32`}
                value={modeOf(part.id)}
                // A size option needs at least one part that responds.
                onChange={(e) => {
                  const mode = e.target.value as 'stretch' | 'anchor' | 'fixed';
                  if (
                    mode === 'fixed' &&
                    group.behaviors.length === 1 &&
                    modeOf(part.id) !== 'fixed'
                  )
                    return;
                  setMode(part.id, mode);
                }}
              >
                <option value="stretch">Stretch</option>
                <option value="anchor">Move</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>
          ))}
        </div>
      </fieldset>
      <MoneyField
        label={`Price change per step (${group.step} ${group.unit}) from the default`}
        currency={config.pricing.currency}
        value={group.pricePerStep}
        onChange={(pricePerStep) => update((g) => ({ ...g, pricePerStep }))}
      />
    </>
  );
}
