'use client';

import type {
  Condition,
  ConditionLeaf,
  OptionGroup,
  ProductConfig,
  Rule,
} from '@twirl/config-schema/engine';
import { type ReactNode, useState } from 'react';

import type { ConfigIssue } from '@/server/products';

import {
  addRule,
  colorOptions,
  defaultCondition,
  isLeaf,
  removeRule,
  updateRule,
} from './config-edit';
import { AlertIcon, BanIcon, EyeIcon, LinkIcon, PlusIcon, TrashIcon } from './icons';
import { ruleSummary } from './summaries';
import {
  Badge,
  Button,
  Callout,
  controlClass,
  focusRing,
  SectionHeader,
  TextField,
  type Tone,
} from './ui';

export interface RulesEditorProps {
  config: ProductConfig;
  issues: ConfigIssue[];
  onChange: (config: ProductConfig) => void;
}

const RULE_TYPES: Record<
  Rule['type'],
  { label: string; tone: Tone; icon: ReactNode; iconClass: string; blurb: string }
> = {
  requires: {
    label: 'Requires',
    tone: 'brand',
    icon: <LinkIcon size={18} />,
    iconClass: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300',
    blurb: 'One choice needs another. Example: large sizes need a metal frame.',
  },
  excludes: {
    label: 'Not together',
    tone: 'rose',
    icon: <BanIcon size={18} />,
    iconClass: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
    blurb: "Two choices that can't be picked together.",
  },
  availability: {
    label: 'Hide or disable',
    tone: 'amber',
    icon: <EyeIcon size={18} />,
    iconClass: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
    blurb: 'Hide or disable an option when another choice is picked.',
  },
};

/**
 * Compatibility rules. When a shopper's choice breaks one, the configurator fixes the other
 * choice automatically and shows the rule's message.
 */
export function RulesEditor({ config, issues, onChange }: RulesEditorProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const hasGroups = config.groups.length > 0;
  return (
    <div className="space-y-6 p-6">
      <SectionHeader
        title="Rules"
        description="Stop combinations you don't sell. If a shopper picks one, we fix it and show your message."
      />
      {!hasGroups && <Callout>Add options first.</Callout>}
      {hasGroups && config.rules.length === 0 && (
        <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-[14px] text-ink-muted">
          No rules yet.
        </p>
      )}

      <ul className="space-y-3" aria-label="Rules">
        {config.rules.map((rule, index) => {
          const open = openId === rule.id;
          const type = RULE_TYPES[rule.type];
          const ruleIssues = issues.filter(
            (i) => i.path === `rules.${index}` || i.path.startsWith(`rules.${index}.`),
          );
          const update = (fn: (r: Rule) => Rule) => onChange(updateRule(config, rule.id, fn));
          return (
            <li
              key={rule.id}
              className={`overflow-hidden rounded-xl border bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${ruleIssues.length ? 'border-red-300 dark:border-red-500/50' : open ? 'border-brand-300 dark:border-brand-500/50' : 'border-line'}`}
            >
              <div className="flex items-start gap-3 p-4">
                <span
                  aria-hidden
                  className={`grid size-10 shrink-0 place-items-center rounded-xl ${type.iconClass}`}
                >
                  {type.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <Badge tone={type.tone}>{type.label}</Badge>
                  <p className="mt-1.5 text-[14px] leading-snug text-ink">
                    {ruleSummary(config, rule)}
                  </p>
                  {ruleIssues.length > 0 ? (
                    <p className="mt-1 flex items-center gap-1 text-[13px] text-red-600 dark:text-red-400">
                      <AlertIcon size={13} /> {ruleIssues[0]?.message}
                    </p>
                  ) : (
                    <p className="mt-1 truncate text-[13px] text-ink-muted">
                      Shoppers see: “{rule.message}”
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant={open ? 'ghost' : 'secondary'}
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : rule.id)}
                >
                  {open ? 'Close' : 'Edit'}
                </Button>
              </div>

              {open && (
                <div className="space-y-4 border-t border-line bg-tint/40 p-5">
                  {rule.type === 'requires' && (
                    <>
                      <Sentence>If a shopper chooses</Sentence>
                      <ConditionEditor
                        config={config}
                        condition={rule.when}
                        onChange={(when) => update((r) => ({ ...r, when }) as Rule)}
                      />
                      <Sentence>they must also have</Sentence>
                      <ConditionEditor
                        config={config}
                        condition={rule.require}
                        onChange={(require) => update((r) => ({ ...r, require }) as Rule)}
                      />
                    </>
                  )}
                  {rule.type === 'excludes' && (
                    <>
                      <Sentence>This choice</Sentence>
                      <ConditionEditor
                        config={config}
                        condition={rule.a}
                        onChange={(a) => update((r) => ({ ...r, a }) as Rule)}
                      />
                      <Sentence>can&apos;t be combined with</Sentence>
                      <ConditionEditor
                        config={config}
                        condition={rule.b}
                        onChange={(b) => update((r) => ({ ...r, b }) as Rule)}
                      />
                    </>
                  )}
                  {rule.type === 'availability' && (
                    <AvailabilityFields config={config} rule={rule} update={update} />
                  )}
                  <TextField
                    label="Message to shoppers"
                    value={rule.message}
                    maxLength={200}
                    onChange={(message) => update((r) => ({ ...r, message }))}
                    error={rule.message.trim() ? undefined : 'Add a message.'}
                  />
                  <div className="flex justify-end border-t border-line pt-4">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onChange(removeRule(config, rule.id))}
                    >
                      <TrashIcon size={14} /> Delete rule
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {hasGroups && (
        <section aria-labelledby="add-rule" className="space-y-3">
          <h3 id="add-rule" className="text-[15px] font-semibold text-ink">
            Add a rule
          </h3>
          <div className="grid gap-2">
            {(['requires', 'excludes', 'availability'] as const).map((kind) => {
              const t = RULE_TYPES[kind];
              return (
                <button
                  key={kind}
                  type="button"
                  onClick={() => {
                    const next = addRule(config, kind);
                    onChange(next);
                    setOpenId(next.rules.at(-1)?.id ?? null);
                  }}
                  className={`flex items-center gap-3 rounded-xl border border-line bg-surface p-3 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/40 dark:hover:bg-brand-500/5 ${focusRing}`}
                >
                  <span
                    aria-hidden
                    className={`grid size-10 shrink-0 place-items-center rounded-xl ${t.iconClass}`}
                  >
                    {t.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-medium text-ink">
                      Add “{t.label}” rule
                    </span>
                    <span className="block text-[13px] text-ink-muted">{t.blurb}</span>
                  </span>
                  <PlusIcon className="shrink-0 text-ink-faint" />
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function Sentence({ children }: { children: ReactNode }) {
  return <p className="text-[14px] font-medium text-ink-soft">{children}</p>;
}

type AvailabilityRule = Extract<Rule, { type: 'availability' }>;

function AvailabilityFields({
  config,
  rule,
  update,
}: {
  config: ProductConfig;
  rule: AvailabilityRule;
  update: (fn: (r: Rule) => Rule) => void;
}) {
  const target = config.groups.find((g) => g.id === rule.target.group);
  const set = (patch: Partial<AvailabilityRule>) =>
    update((r) => ({ ...(r as AvailabilityRule), ...patch }));
  return (
    <>
      <Sentence>While a shopper has</Sentence>
      <ConditionEditor config={config} condition={rule.when} onChange={(when) => set({ when })} />
      <Sentence>then</Sentence>
      <div className="flex items-center gap-2">
        <select
          aria-label="Effect"
          className={`${controlClass} w-32`}
          value={rule.effect}
          onChange={(e) => set({ effect: e.target.value as AvailabilityRule['effect'] })}
        >
          <option value="disable">disable</option>
          <option value="hide">hide</option>
        </select>
        <select
          aria-label="Target option"
          className={controlClass}
          value={rule.target.group}
          onChange={(e) => set({ target: { group: e.target.value } })}
        >
          {config.groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
      </div>
      {target?.type === 'color' && (
        <fieldset>
          <legend className="text-[13px] text-ink-muted">
            Only these colours (leave empty for all)
          </legend>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
            {colorOptions(target).map((option) => {
              const options = rule.target.options ?? [];
              const checked = options.includes(option.id);
              return (
                <label key={option.id} className="flex items-center gap-1.5 text-[14px] text-ink">
                  <input
                    type="checkbox"
                    className="accent-brand-600"
                    checked={checked}
                    onChange={() => {
                      const next = checked
                        ? options.filter((o) => o !== option.id)
                        : [...options, option.id];
                      set({
                        target: next.length
                          ? { group: target.id, options: next }
                          : { group: target.id },
                      });
                    }}
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}
    </>
  );
}

/** One condition on one option: "Seat fabric is Sage", "Diameter is at least 135 cm". */
function ConditionEditor({
  config,
  condition,
  onChange,
}: {
  config: ProductConfig;
  condition: Condition;
  onChange: (condition: ConditionLeaf) => void;
}) {
  const first = config.groups[0];
  if (!isLeaf(condition)) {
    return (
      <div className="rounded-xl bg-surface p-3 text-[14px] text-ink-muted ring-1 ring-line">
        This rule uses a combined condition that the editor can&apos;t show yet.{' '}
        {first && (
          <button
            type="button"
            onClick={() => onChange(defaultCondition(first))}
            className="font-medium text-brand-700 underline dark:text-brand-200"
          >
            Replace with a simple condition
          </button>
        )}
      </div>
    );
  }
  const group = config.groups.find((g) => g.id === condition.group);
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl bg-surface p-3 ring-1 ring-line">
      <select
        aria-label="Option"
        className={`${controlClass} w-auto max-w-[55%]`}
        value={condition.group}
        onChange={(e) => {
          const next = config.groups.find((g) => g.id === e.target.value);
          if (next) onChange(defaultCondition(next));
        }}
      >
        {!group && <option value={condition.group}>(removed option)</option>}
        {config.groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.label}
          </option>
        ))}
      </select>
      {group && <ComparisonEditor group={group} condition={condition} onChange={onChange} />}
    </div>
  );
}

function ComparisonEditor({
  group,
  condition,
  onChange,
}: {
  group: OptionGroup;
  condition: ConditionLeaf;
  onChange: (condition: ConditionLeaf) => void;
}) {
  const select = `${controlClass} w-auto`;
  if (group.type === 'visibility') {
    return (
      <select
        aria-label="State"
        className={select}
        value={condition.equals === false ? 'hidden' : 'shown'}
        onChange={(e) => onChange({ group: group.id, equals: e.target.value === 'shown' })}
      >
        <option value="shown">is shown</option>
        <option value="hidden">is hidden</option>
      </select>
    );
  }
  if (group.type === 'dimension') {
    const atMost = condition.max !== undefined;
    const value = condition.max ?? condition.min ?? group.default;
    return (
      <>
        <select
          aria-label="Comparison"
          className={select}
          value={atMost ? 'max' : 'min'}
          onChange={(e) =>
            onChange(
              e.target.value === 'max'
                ? { group: group.id, max: value }
                : { group: group.id, min: value },
            )
          }
        >
          <option value="min">is at least</option>
          <option value="max">is at most</option>
        </select>
        <input
          aria-label="Size"
          type="number"
          className={`${controlClass} w-24`}
          value={value}
          min={group.min}
          max={group.max}
          step={group.step}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isFinite(n)) return;
            onChange(atMost ? { group: group.id, max: n } : { group: group.id, min: n });
          }}
        />
        <span className="text-[13px] text-ink-muted">{group.unit}</span>
      </>
    );
  }
  const options = colorOptions(group);
  const many = condition.oneOf !== undefined;
  const chosen = condition.oneOf ?? [String(condition.equals ?? 'original')];
  return (
    <>
      <select
        aria-label="Comparison"
        className={select}
        value={many ? 'oneOf' : 'equals'}
        onChange={(e) =>
          onChange(
            e.target.value === 'oneOf'
              ? { group: group.id, oneOf: chosen }
              : { group: group.id, equals: chosen[0] ?? 'original' },
          )
        }
      >
        <option value="equals">is</option>
        <option value="oneOf">is one of</option>
      </select>
      {many ? (
        <div className="flex w-full flex-wrap gap-x-3 gap-y-1">
          {options.map((o) => {
            const checked = chosen.includes(o.id);
            return (
              <label key={o.id} className="flex items-center gap-1.5 text-[14px] text-ink">
                <input
                  type="checkbox"
                  className="accent-brand-600"
                  checked={checked}
                  disabled={checked && chosen.length === 1}
                  onChange={() =>
                    onChange({
                      group: group.id,
                      oneOf: checked ? chosen.filter((c) => c !== o.id) : [...chosen, o.id],
                    })
                  }
                />
                {o.label}
              </label>
            );
          })}
        </div>
      ) : (
        <select
          aria-label="Choice"
          className={select}
          value={chosen[0]}
          onChange={(e) => onChange({ group: group.id, equals: e.target.value })}
        >
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </>
  );
}
