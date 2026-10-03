import type { OptionGroup, ProductConfig } from '../config';
import { defaultValue, type SelectionValue, type Selections, snapDimension } from '../selections';
import { groupsIn, optionIdOf, satisfyingValue, testCondition } from './conditions';

export interface GroupAvailability {
  hidden: boolean;
  disabled: boolean;
  /** Shopper-facing reason when hidden or disabled. */
  reason?: string;
  /** Per-option state for colour groups (option id → state). */
  options: Record<string, { hidden: boolean; disabled: boolean; reason?: string }>;
}

export interface Correction {
  group: string;
  from: SelectionValue;
  to: SelectionValue;
  rule: string;
  message: string;
}

export interface Violation {
  rule: string;
  message: string;
}

export interface RulesResult {
  selections: Selections;
  availability: Record<string, GroupAvailability>;
  corrections: Correction[];
  /** Rules still broken after correcting (e.g. contradictory or circular rules). */
  violations: Violation[];
}

function availabilityFor(config: ProductConfig, selections: Selections) {
  const availability: Record<string, GroupAvailability> = {};
  for (const group of config.groups) {
    const options: GroupAvailability['options'] = {};
    if (group.type === 'color') {
      for (const id of ['original', ...group.swatches.map((s) => s.id), 'custom']) {
        options[id] = { hidden: false, disabled: false };
      }
    }
    availability[group.id] = { hidden: false, disabled: false, options };
  }
  for (const rule of config.rules) {
    if (rule.type !== 'availability' || !testCondition(rule.when, selections)) continue;
    const target = availability[rule.target.group];
    if (!target) continue;
    const flag = rule.effect === 'hide' ? 'hidden' : 'disabled';
    if (!rule.target.options) {
      target[flag] = true;
      target.reason ??= rule.message;
    } else {
      for (const id of rule.target.options) {
        const option = target.options[id];
        if (option) {
          option[flag] = true;
          option.reason ??= rule.message;
        }
      }
    }
  }
  return availability;
}

/** The value a group falls back to when its choice is unavailable. */
function fallbackValue(group: OptionGroup, state: GroupAvailability): SelectionValue {
  if (group.type === 'visibility') return state.hidden || state.disabled ? false : group.default;
  if (group.type === 'dimension') return group.default;
  const usable = (id: string) => !state.options[id]?.hidden && !state.options[id]?.disabled;
  const preferred = defaultValue(group);
  if (typeof preferred === 'string' && usable(preferred)) return preferred;
  return ['original', ...group.swatches.map((s) => s.id)].find(usable) ?? 'original';
}

function isUnavailable(group: OptionGroup, state: GroupAvailability, value: SelectionValue) {
  if (group.type === 'visibility') return (state.hidden || state.disabled) && value === true;
  if (state.hidden || state.disabled) return value !== fallbackValue(group, state);
  if (group.type !== 'color') return false;
  const option = state.options[optionIdOf(value) ?? ''];
  return option !== undefined && (option.hidden || option.disabled);
}

/**
 * Applies the config's rules to (structurally valid) selections:
 * - availability rules hide or disable groups/options; unavailable choices fall back
 * - `requires` and `excludes` are auto-corrected. The group the shopper just changed
 *   (`changed`) is kept and the other side is adjusted; otherwise the dependent side changes.
 * Repeats until stable; anything still broken is reported as a violation.
 */
export function applyRules(
  config: ProductConfig,
  input: Selections,
  changed?: string,
): RulesResult {
  const selections: Selections = { ...input };
  const corrections: Correction[] = [];
  // Groups whose value must be kept: the shopper's latest change, and anything a `requires`
  // rule had to select. Conflicts adjust the other side.
  const protectedGroups = new Set<string>(changed ? [changed] : []);
  const isProtected = (c: Parameters<typeof groupsIn>[0]) =>
    groupsIn(c).some((g) => protectedGroups.has(g));
  const groups = new Map(config.groups.map((g) => [g.id, g]));

  const set = (groupId: string, value: SelectionValue, rule: string, message: string) => {
    const group = groups.get(groupId);
    const current = selections[groupId];
    if (!group || current === undefined) return false;
    const next =
      group.type === 'dimension' && typeof value === 'number' ? snapDimension(group, value) : value;
    if (JSON.stringify(current) === JSON.stringify(next)) return false;
    corrections.push({ group: groupId, from: current, to: next, rule, message });
    selections[groupId] = next;
    return true;
  };
  const reset = (groupIds: string[], rule: string, message: string) => {
    let changedAny = false;
    for (const id of new Set(groupIds)) {
      const group = groups.get(id);
      if (group) changedAny = set(id, defaultValue(group), rule, message) || changedAny;
    }
    return changedAny;
  };

  const maxPasses = config.rules.length * 2 + 2;
  let availability = availabilityFor(config, selections);
  for (let pass = 0; pass < maxPasses; pass++) {
    let changedThisPass = false;

    for (const group of config.groups) {
      const state = availability[group.id];
      const value = selections[group.id];
      if (!state || value === undefined || !isUnavailable(group, state, value)) continue;
      const reason =
        state.reason ?? state.options[optionIdOf(value) ?? '']?.reason ?? 'Not available.';
      changedThisPass =
        set(group.id, fallbackValue(group, state), 'availability', reason) || changedThisPass;
    }

    for (const rule of config.rules) {
      if (rule.type === 'excludes') {
        if (!testCondition(rule.a, selections) || !testCondition(rule.b, selections)) continue;
        // Keep the protected side (the shopper's change, or a required choice); else keep `a`.
        const fix = isProtected(rule.b) && !isProtected(rule.a) ? rule.a : rule.b;
        changedThisPass = reset(groupsIn(fix), rule.id, rule.message) || changedThisPass;
      } else if (rule.type === 'requires') {
        if (!testCondition(rule.when, selections) || testCondition(rule.require, selections))
          continue;
        const shopperChangedRequirement =
          changed !== undefined && groupsIn(rule.require).includes(changed);
        if (shopperChangedRequirement) {
          // They moved away from what's required: undo the trigger instead.
          changedThisPass = reset(groupsIn(rule.when), rule.id, rule.message) || changedThisPass;
        } else {
          const fix = satisfyingValue(rule.require, config);
          if (fix) protectedGroups.add(fix.group);
          changedThisPass =
            (fix
              ? set(fix.group, fix.value, rule.id, rule.message)
              : reset(groupsIn(rule.when), rule.id, rule.message)) || changedThisPass;
        }
      }
    }

    availability = availabilityFor(config, selections);
    if (!changedThisPass) break;
  }

  const violations: Violation[] = [];
  for (const rule of config.rules) {
    const broken =
      (rule.type === 'excludes' &&
        testCondition(rule.a, selections) &&
        testCondition(rule.b, selections)) ||
      (rule.type === 'requires' &&
        testCondition(rule.when, selections) &&
        !testCondition(rule.require, selections));
    if (broken) violations.push({ rule: rule.id, message: rule.message });
  }
  return { selections, availability, corrections, violations };
}
