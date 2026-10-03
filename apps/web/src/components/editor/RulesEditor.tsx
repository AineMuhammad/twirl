'use client';

import type {
  Condition,
  ConditionLeaf,
  OptionGroup,
  ProductConfig,
  Rule,
} from '@twirl/config-schema/engine';

import {
  addRule,
  colorOptions,
  defaultCondition,
  isLeaf,
  removeRule,
  updateRule,
} from './config-edit';
import { IconButton, inputClass, TextField } from './fields';
import { PlusIcon, TrashIcon } from './icons';

export interface RulesEditorProps {
  config: ProductConfig;
  onChange: (config: ProductConfig) => void;
}

const RULE_TITLES: Record<Rule['type'], string> = {
  requires: 'Requires',
  excludes: "Can't combine",
  availability: 'Hide or disable',
};

/**
 * Compatibility rules. When a shopper's choice breaks one, the configurator fixes the other
 * choice and shows the rule's message.
 */
export function RulesEditor({ config, onChange }: RulesEditorProps) {
  const hasGroups = config.groups.length > 0;
  return (
    <div className="space-y-4 p-5">
      <p className="text-xs text-ink-muted">
        Rules keep shoppers from picking combinations you don&apos;t sell. Conflicts are corrected
        automatically and explained with your message.
      </p>
      <ul className="space-y-3" aria-label="Rules">
        {config.rules.map((rule) => {
          const update = (fn: (r: Rule) => Rule) => onChange(updateRule(config, rule.id, fn));
          return (
            <li key={rule.id} className="space-y-3 rounded-xl border border-line bg-surface p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold tracking-wide text-ink-soft uppercase">
                  {RULE_TITLES[rule.type]}
                </span>
                <IconButton
                  label="Remove rule"
                  tone="danger"
                  onClick={() => onChange(removeRule(config, rule.id))}
                >
                  <TrashIcon />
                </IconButton>
              </div>

              {rule.type === 'requires' && (
                <>
                  <Sentence>When</Sentence>
                  <ConditionEditor
                    config={config}
                    condition={rule.when}
                    onChange={(when) => update((r) => ({ ...r, when }) as Rule)}
                  />
                  <Sentence>the shopper must also have</Sentence>
                  <ConditionEditor
                    config={config}
                    condition={rule.require}
                    onChange={(require) => update((r) => ({ ...r, require }) as Rule)}
                  />
                </>
              )}
              {rule.type === 'excludes' && (
                <>
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
                label="Message shown to shoppers"
                value={rule.message}
                maxLength={200}
                onChange={(message) => update((r) => ({ ...r, message }))}
              />
            </li>
          );
        })}
      </ul>

      {!hasGroups ? (
        <p className="text-xs text-ink-muted">Add options first; rules connect options.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {(['requires', 'excludes', 'availability'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onChange(addRule(config, type))}
              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-tint"
            >
              <PlusIcon /> {RULE_TITLES[type]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Sentence({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-ink-muted">{children}</p>;
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
      <Sentence>When</Sentence>
      <ConditionEditor config={config} condition={rule.when} onChange={(when) => set({ when })} />
      <div className="flex items-center gap-2">
        <select
          aria-label="Effect"
          className={`${inputClass} w-28`}
          value={rule.effect}
          onChange={(e) => set({ effect: e.target.value as AvailabilityRule['effect'] })}
        >
          <option value="disable">disable</option>
          <option value="hide">hide</option>
        </select>
        <select
          aria-label="Target option"
          className={inputClass}
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
          <legend className="text-xs text-ink-muted">
            Only these choices (leave all unticked for the whole option)
          </legend>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
            {colorOptions(target).map((option) => {
              const options = rule.target.options ?? [];
              const checked = options.includes(option.id);
              return (
                <label key={option.id} className="flex items-center gap-1.5 text-sm text-ink">
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
      <div className="rounded-lg bg-tint p-2 text-xs text-ink-muted">
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
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-tint p-2">
      <select
        aria-label="Option"
        className={`${inputClass} w-auto max-w-[45%]`}
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
  const select = `${inputClass} w-auto`;
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
          className={`${inputClass} w-20`}
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
        <span className="text-xs text-ink-muted">{group.unit}</span>
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
              <label key={o.id} className="flex items-center gap-1.5 text-sm text-ink">
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
