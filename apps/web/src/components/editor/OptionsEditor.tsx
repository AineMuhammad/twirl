'use client';

import type {
  ColorGroup,
  DimensionGroup,
  OptionGroup,
  ProductConfig,
  VisibilityGroup,
} from '@twirl/config-schema/engine';
import type { ReactNode } from 'react';

import type { ConfigIssue } from '@/server/products';

import {
  addDimensionGroup,
  addSwatch,
  colorGroupOf,
  removeGroup,
  removeSwatch,
  setPartColorable,
  setPartCustomisable,
  setPartHideable,
  updateGroup,
  visibilityGroupOf,
} from './config-edit';
import { AlertIcon, EyeIcon, PaletteIcon, PlusIcon, RulerIcon, TrashIcon } from './icons';
import { groupSummary } from './summaries';
import {
  Badge,
  Button,
  Callout,
  ChipToggle,
  controlClass,
  InfoTip,
  MoneyField,
  MoneyInput,
  NumberField,
  SectionHeader,
  Segmented,
  SelectField,
  Subsection,
  TextField,
  Toggle,
} from './ui';

export interface OptionsEditorProps {
  config: ProductConfig;
  issues: ConfigIssue[];
  onChange: (config: ProductConfig) => void;
  /** The open card: `part:<partId>` for a part, or a size option's id. */
  openId: string | null;
  onOpen: (id: string | null) => void;
}

/** Issues for one option group, by its position in the config. */
function issuesFor(config: ProductConfig, issues: ConfigIssue[], group: OptionGroup | undefined) {
  if (!group) return [];
  const index = config.groups.indexOf(group);
  return issues.filter(
    (i) => i.path === `groups.${index}` || i.path.startsWith(`groups.${index}.`),
  );
}

function IssueList({ issues }: { issues: ConfigIssue[] }) {
  if (issues.length === 0) return null;
  return (
    <ul className="space-y-1 rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-700 ring-1 ring-red-200 dark:bg-red-500/10 dark:text-red-200 dark:ring-red-500/25">
      {issues.map((i) => (
        <li key={`${i.path}${i.message}`}>{i.message}</li>
      ))}
    </ul>
  );
}

/** A panel inside a part card: icon, title, on/off switch, and settings when on. */
function OptionPanel({
  icon,
  iconClass,
  title,
  toggleLabel,
  toggleHelp,
  on,
  onToggle,
  children,
}: {
  icon: ReactNode;
  iconClass: string;
  title: string;
  toggleLabel: string;
  toggleHelp: string;
  on: boolean;
  onToggle: (on: boolean) => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl bg-surface ring-1 ring-line">
      <div className="flex items-start gap-3 p-4">
        <span
          aria-hidden
          className={`grid size-9 shrink-0 place-items-center rounded-lg ${iconClass}`}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="text-[15px] font-semibold text-ink">{title}</h4>
          <div className="mt-2">
            <Toggle label={toggleLabel} description={toggleHelp} checked={on} onChange={onToggle} />
          </div>
        </div>
      </div>
      {on && <div className="space-y-6 border-t border-line px-4 pt-4 pb-5">{children}</div>}
    </section>
  );
}

/**
 * Step 3. For each part, shoppers can be allowed to change its colour and/or remove it: two
 * separate switches, each with its own settings. Sizes apply to the whole product.
 */
export function OptionsEditor({ config, issues, onChange, openId, onOpen }: OptionsEditorProps) {
  const sizes = config.groups.filter((g): g is DimensionGroup => g.type === 'dimension');

  return (
    <div className="space-y-10 p-6">
      <div className="space-y-5">
        <SectionHeader
          title="Options"
          description="Switch on “Customisable” for the parts shoppers can change. Then choose whether they can change its colour, remove it, or both."
        />
        {config.parts.length === 0 && (
          <Callout>Choose your customisable parts in step 2 first.</Callout>
        )}
        <ul className="space-y-3" aria-label="Options for each part">
          {config.parts.map((part) => {
            const color = colorGroupOf(config, part.id);
            const visibility = visibilityGroupOf(config, part.id);
            const colorIssues = issuesFor(config, issues, color);
            const visibilityIssues = issuesFor(config, issues, visibility);
            const problems = colorIssues.length + visibilityIssues.length;
            const customisable = Boolean(color || visibility);
            const shared = (group: OptionGroup | undefined) =>
              group && group.type !== 'dimension' && group.parts.length > 1
                ? group.parts
                    .filter((p) => p !== part.id)
                    .map((p) => config.parts.find((x) => x.id === p)?.label ?? p)
                : [];
            return (
              <li
                key={part.id}
                id={`part-options-${part.id}`}
                className={`overflow-hidden rounded-2xl border bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${problems ? 'border-red-300 dark:border-red-500/50' : customisable ? 'border-brand-300 dark:border-brand-500/50' : 'border-line'}`}
              >
                <div className="flex items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-semibold text-ink">
                      {part.label || 'Unnamed part'}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {!customisable ? (
                        <span className="text-[13px] text-ink-muted">
                          Fixed: always looks as in your 3D file
                        </span>
                      ) : problems > 0 ? (
                        <Badge tone="red">
                          <AlertIcon size={12} /> Needs attention
                        </Badge>
                      ) : (
                        <>
                          <Badge tone={color ? 'violet' : 'neutral'}>
                            <PaletteIcon size={12} />
                            {!color
                              ? 'Colour fixed'
                              : color.swatches.length === 0 && !color.allowCustom
                                ? 'Colour: original only'
                                : `Colour: ${color.swatches.length + 1} choices${color.allowCustom ? ' + any' : ''}`}
                          </Badge>
                          <Badge tone={visibility ? 'sky' : 'neutral'}>
                            <EyeIcon size={12} />
                            {visibility ? 'Can be removed' : 'Always shown'}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                  <label className="flex shrink-0 cursor-pointer items-center gap-2.5 text-[14px] font-medium text-ink">
                    Customisable
                    <button
                      type="button"
                      role="switch"
                      aria-checked={customisable}
                      aria-label={`${part.label} is customisable`}
                      onClick={() => onChange(setPartCustomisable(config, part.id, !customisable))}
                      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${customisable ? 'bg-brand-600' : 'bg-tint-strong'}`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${customisable ? 'translate-x-5' : ''}`}
                      />
                    </button>
                  </label>
                </div>

                {customisable && (
                  <div className="space-y-4 border-t border-line bg-tint/40 p-4">
                    <OptionPanel
                      icon={<PaletteIcon size={17} />}
                      iconClass="bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300"
                      title="Colour"
                      toggleLabel="Shoppers can change the colour"
                      toggleHelp="Off: this part keeps the finish from your 3D file."
                      on={Boolean(color)}
                      onToggle={(on) => onChange(setPartColorable(config, part.id, on))}
                    >
                      {color && (
                        <>
                          <IssueList issues={colorIssues} />
                          {shared(color).length > 0 && (
                            <Callout tone="warning">
                              This colour is shared with {shared(color).join(', ')}. Changes apply
                              to all of them.
                            </Callout>
                          )}
                          <TextField
                            label="Heading shoppers see"
                            hint="e.g. “Seat colour” or “Fabric”."
                            value={color.label}
                            onChange={(label) =>
                              onChange(
                                updateGroup<ColorGroup>(config, color.id, (g) => ({ ...g, label })),
                              )
                            }
                            error={color.label.trim() ? undefined : 'Add a heading.'}
                          />
                          <ColorGroupFields
                            config={config}
                            group={color}
                            update={(fn) => onChange(updateGroup<ColorGroup>(config, color.id, fn))}
                          />
                        </>
                      )}
                    </OptionPanel>

                    <OptionPanel
                      icon={<EyeIcon size={17} />}
                      iconClass="bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300"
                      title="Show / hide"
                      toggleLabel="Shoppers can remove this part"
                      toggleHelp="For optional extras like cushions or a headrest. Off: always shown."
                      on={Boolean(visibility)}
                      onToggle={(on) => onChange(setPartHideable(config, part.id, on))}
                    >
                      {visibility && (
                        <>
                          <IssueList issues={visibilityIssues} />
                          {shared(visibility).length > 0 && (
                            <Callout tone="warning">
                              Shown and hidden together with {shared(visibility).join(', ')}.
                            </Callout>
                          )}
                          <TextField
                            label="Label shoppers see"
                            hint="Next to the on/off switch, e.g. “Add cushions”."
                            value={visibility.label}
                            onChange={(label) =>
                              onChange(
                                updateGroup<VisibilityGroup>(config, visibility.id, (g) => ({
                                  ...g,
                                  label,
                                })),
                              )
                            }
                            error={visibility.label.trim() ? undefined : 'Add a label.'}
                          />
                          <VisibilityGroupFields
                            config={config}
                            group={visibility}
                            update={(fn) =>
                              onChange(updateGroup<VisibilityGroup>(config, visibility.id, fn))
                            }
                          />
                        </>
                      )}
                    </OptionPanel>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Sizes */}
      <section aria-labelledby="sizes" className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="sizes" className="flex items-center gap-2 text-[17px] font-semibold text-ink">
              <RulerIcon size={18} /> Sizes
            </h3>
            <p className="mt-1 text-[14px] text-ink-muted">
              Optional sliders that resize the whole product, like width or length.
            </p>
          </div>
          <Button
            size="sm"
            disabled={config.parts.length === 0}
            title={config.parts.length === 0 ? 'Choose customisable parts first' : undefined}
            onClick={() => {
              const first = config.parts[0];
              if (!first) return;
              const next = addDimensionGroup(
                config,
                'Width',
                config.parts.map((p) => p.id),
              );
              onChange(next);
              onOpen(next.groups.at(-1)?.id ?? null);
            }}
          >
            <PlusIcon size={14} /> Add a size
          </Button>
        </div>
        {sizes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line px-4 py-5 text-center text-[14px] text-ink-muted">
            No sizes. Shoppers get your product at the size it was modelled.
          </p>
        ) : (
          <ul className="space-y-3" aria-label="Sizes">
            {sizes.map((group) => {
              const open = openId === group.id;
              const groupIssues = issuesFor(config, issues, group);
              const update = (fn: (g: DimensionGroup) => DimensionGroup) =>
                onChange(updateGroup<DimensionGroup>(config, group.id, fn));
              return (
                <li
                  key={group.id}
                  id={`option-${group.id}`}
                  className={`overflow-hidden rounded-2xl border bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${groupIssues.length ? 'border-red-300 dark:border-red-500/50' : open ? 'border-brand-300 dark:border-brand-500/50' : 'border-line'}`}
                >
                  <div className="flex items-center gap-3 p-4">
                    <span
                      aria-hidden
                      className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300"
                    >
                      <RulerIcon size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-ink">
                        {group.label || 'Untitled size'}
                      </p>
                      <p className="mt-0.5 truncate text-[13px] text-ink-muted">
                        {groupIssues.length ? (
                          <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                            <AlertIcon size={13} /> Needs attention
                          </span>
                        ) : (
                          groupSummary(config, group)
                        )}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={open ? 'ghost' : 'secondary'}
                      aria-expanded={open}
                      onClick={() => onOpen(open ? null : group.id)}
                    >
                      {open ? 'Close' : 'Edit'}
                    </Button>
                  </div>
                  {open && (
                    <div className="space-y-6 border-t border-line bg-tint/40 p-5">
                      <IssueList issues={groupIssues} />
                      <TextField
                        label="Name shoppers see"
                        hint="Above the slider, e.g. “Width” or “Table length”."
                        value={group.label}
                        onChange={(label) => update((g) => ({ ...g, label }))}
                        error={group.label.trim() ? undefined : 'Add a name.'}
                      />
                      <DimensionGroupFields config={config} group={group} update={update} />
                      <div className="flex justify-end border-t border-line pt-4">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            onChange(removeGroup(config, group.id));
                            onOpen(null);
                          }}
                        >
                          <TrashIcon size={14} /> Delete size
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

type Update<G> = (fn: (g: G) => G) => void;

const CHECKER = 'repeating-conic-gradient(#e5e5e5 0 25%, #fff 0 50%) 50% / 10px 10px';

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
  const setSwatch = (id: string, patch: Partial<ColorGroup['swatches'][number]>) =>
    update((g) => ({
      ...g,
      swatches: g.swatches.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));

  return (
    <>
      <Subsection
        title="Colours"
        help="The colours shoppers can pick. Your model's own finish (as uploaded, textures included) is always offered too."
      >
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <div className="grid grid-cols-[2.5rem_1fr_8rem_5rem] items-center gap-3 border-b border-line bg-tint px-3 py-2 text-[12px] font-medium text-ink-muted">
            <span>Colour</span>
            <span>Name</span>
            <span className="flex items-center gap-1">
              Extra cost
              <InfoTip label="About extra cost" align="end">
                Added to the price when a shopper picks this colour. Use a negative amount for a
                discount, or 0 for no change.
              </InfoTip>
            </span>
            <span className="sr-only">Actions</span>
          </div>
          <ul className="divide-y divide-line">
            <li className="grid grid-cols-[2.5rem_1fr_8rem_5rem] items-center gap-3 px-3 py-2.5">
              <span
                aria-hidden
                title="Your model's own finish"
                className="size-10 rounded-lg shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]"
                style={{ background: CHECKER }}
              />
              <div>
                <input
                  aria-label="Name of your model's own finish"
                  className={controlClass}
                  value={group.originalLabel}
                  maxLength={80}
                  onChange={(e) => update((g) => ({ ...g, originalLabel: e.target.value }))}
                />
                <p className="mt-1 text-[12px] text-ink-muted">Your model&apos;s own finish</p>
              </div>
              <span className="text-[13px] text-ink-muted">No extra cost</span>
              <span />
            </li>
            {group.swatches.map((swatch) => (
              <li
                key={swatch.id}
                className="grid grid-cols-[2.5rem_1fr_8rem_5rem] items-center gap-3 px-3 py-2.5"
              >
                <label
                  title="Click to change this colour"
                  className="relative size-10 cursor-pointer overflow-hidden rounded-lg shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-600"
                  style={{ background: swatch.color }}
                >
                  <input
                    type="color"
                    aria-label={`Change the colour of ${swatch.label}`}
                    value={swatch.color}
                    onChange={(e) => setSwatch(swatch.id, { color: e.target.value.toLowerCase() })}
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                  />
                </label>
                <input
                  aria-label="Colour name"
                  className={`${controlClass} ${swatch.label.trim() ? '' : 'border-red-400'}`}
                  value={swatch.label}
                  maxLength={80}
                  placeholder="Name this colour"
                  onChange={(e) => setSwatch(swatch.id, { label: e.target.value })}
                />
                <MoneyInput
                  ariaLabel={`Extra cost for ${swatch.label}`}
                  currency={currency}
                  value={swatch.price}
                  onChange={(price) => setSwatch(swatch.id, { price })}
                />
                <Button
                  size="sm"
                  variant="danger"
                  title={`Remove ${swatch.label}`}
                  onClick={() => update((g) => removeSwatch(g, swatch.id))}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
          {group.swatches.length === 0 && (
            <p className="border-t border-line px-3 py-3 text-[13px] text-ink-muted">
              Only your model&apos;s own finish so far. Add the colours shoppers can choose from.
            </p>
          )}
          <div className="border-t border-line px-3 py-2">
            <Button variant="ghost" size="sm" onClick={() => update(addSwatch)}>
              <PlusIcon size={14} /> Add a colour
            </Button>
          </div>
        </div>
        <SelectField
          label="Shoppers start with"
          help="The colour shown before a shopper picks one."
          value={group.default ?? ''}
          options={[
            { value: '', label: `${group.originalLabel || 'Original'} (your model's finish)` },
            ...group.swatches.map((s) => ({ value: s.id, label: s.label || 'Unnamed colour' })),
          ]}
          onChange={(value) => update((g) => ({ ...g, default: value || null }))}
        />
      </Subsection>
      <Subsection title="Custom colour">
        <Toggle
          label="Let shoppers pick any colour"
          description="Adds a colour picker after your choices."
          checked={group.allowCustom}
          onChange={(allowCustom) => update((g) => ({ ...g, allowCustom }))}
        />
        {group.allowCustom && (
          <MoneyField
            label="Price for a custom colour"
            currency={currency}
            value={group.customPrice}
            onChange={(customPrice) => update((g) => ({ ...g, customPrice }))}
          />
        )}
      </Subsection>
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
      <Subsection title="Behaviour">
        <Toggle
          label="Included by default"
          description="Whether shoppers see these parts before changing anything."
          checked={group.default}
          onChange={(value) => update((g) => ({ ...g, default: value }))}
        />
        <MoneyField
          label="Price when included"
          help="Added to the price whenever these parts are shown, including by default."
          currency={config.pricing.currency}
          value={group.price}
          onChange={(price) => update((g) => ({ ...g, price }))}
        />
      </Subsection>
    </>
  );
}

const UNIT_OPTIONS = [
  { value: 'mm', label: 'Millimetres (mm)' },
  { value: 'cm', label: 'Centimetres (cm)' },
  { value: 'm', label: 'Metres (m)' },
  { value: 'in', label: 'Inches (in)' },
] as const;

const AXES = [
  { axis: 'x', label: 'Width', hint: 'left to right' },
  { axis: 'y', label: 'Height', hint: 'bottom to top' },
  { axis: 'z', label: 'Depth', hint: 'front to back' },
] as const;

const RESPONSES = [
  {
    value: 'stretch',
    label: 'Stretch',
    title: 'Grows and shrinks with the size (seats, tabletops).',
  },
  {
    value: 'anchor',
    label: 'Move',
    title: 'Keeps its own size but moves to stay attached (legs, cushions).',
  },
  { value: 'fixed', label: 'Fixed', title: 'Not affected by this size.' },
] as const;

function DimensionGroupFields({
  config,
  group,
  update,
}: {
  config: ProductConfig;
  group: DimensionGroup;
  update: Update<DimensionGroup>;
}) {
  const unit = group.unit;
  const modeOf = (part: string) => group.behaviors.find((b) => b.part === part)?.mode ?? 'fixed';
  const setMode = (part: string, mode: 'stretch' | 'anchor' | 'fixed') =>
    update((g) => {
      const others = g.behaviors.filter((b) => b.part !== part);
      return { ...g, behaviors: mode === 'fixed' ? others : [...others, { part, mode }] };
    });
  return (
    <>
      <Subsection
        title="Range"
        help="Shoppers move a slider between the minimum and maximum, in steps."
      >
        <SelectField
          label="Unit"
          value={unit}
          options={UNIT_OPTIONS}
          onChange={(u) => update((g) => ({ ...g, unit: u }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Smallest"
            suffix={unit}
            value={group.min}
            min={0}
            onChange={(min) => update((g) => ({ ...g, min }))}
          />
          <NumberField
            label="Largest"
            suffix={unit}
            value={group.max}
            min={0}
            onChange={(max) => update((g) => ({ ...g, max }))}
          />
          <NumberField
            label="Step"
            help="How much each notch of the slider changes the size."
            suffix={unit}
            value={group.step}
            min={0}
            onChange={(step) => update((g) => ({ ...g, step }))}
          />
          <NumberField
            label="Starts at"
            help="The size shoppers see first. Prices are relative to it."
            suffix={unit}
            value={group.default}
            min={0}
            onChange={(value) => update((g) => ({ ...g, default: value }))}
          />
        </div>
      </Subsection>
      <Subsection
        title="Real size of your model"
        help="Measure your uploaded model in the directions below (for example its width in cm). Twirl scales it relative to this, so a shopper picking 140 on a 120 cm model makes it 140/120 = 1.17× larger."
      >
        <NumberField
          label={`Size as uploaded`}
          suffix={unit}
          value={group.nativeSize}
          min={0}
          onChange={(nativeSize) => update((g) => ({ ...g, nativeSize }))}
          hint="If this is wrong, sizes in the preview won't match the numbers shoppers pick."
        />
        <div>
          <p className="mb-2 text-[14px] font-medium text-ink">Directions it changes</p>
          <div className="flex flex-wrap gap-2">
            {AXES.map(({ axis, label, hint }) => {
              const checked = group.axes.includes(axis);
              return (
                <ChipToggle
                  key={axis}
                  selected={checked}
                  disabled={checked && group.axes.length === 1}
                  title={`${label}: ${hint}`}
                  onClick={() =>
                    update((g) => ({
                      ...g,
                      axes: checked ? g.axes.filter((a) => a !== axis) : [...g.axes, axis],
                    }))
                  }
                >
                  {label}
                </ChipToggle>
              );
            })}
          </div>
        </div>
      </Subsection>
      <Subsection
        title="How each part responds"
        help="Stretch: grows with the size (seat, tabletop). Move: keeps its size but moves to stay attached (legs, cushions). Fixed: unaffected."
      >
        <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
          {config.parts.map((part) => {
            const mode = modeOf(part.id);
            const lastResponding = mode !== 'fixed' && group.behaviors.length === 1;
            return (
              <li key={part.id} className="flex items-center gap-3 px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-[14px] text-ink">{part.label}</span>
                <Segmented
                  label={`How ${part.label} responds`}
                  value={mode}
                  options={RESPONSES}
                  onChange={(next) => {
                    // A size option needs at least one part that responds.
                    if (next === 'fixed' && lastResponding) return;
                    setMode(part.id, next);
                  }}
                />
              </li>
            );
          })}
        </ul>
      </Subsection>
      <Subsection title="Price">
        <MoneyField
          label={`Price change per ${group.step} ${unit}`}
          help={`Each step above “Starts at” adds this; each step below takes it off.`}
          currency={config.pricing.currency}
          value={group.pricePerStep}
          onChange={(pricePerStep) => update((g) => ({ ...g, pricePerStep }))}
        />
      </Subsection>
    </>
  );
}
