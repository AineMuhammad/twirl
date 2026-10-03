import type { Condition, ConditionLeaf, OptionGroup, ProductConfig } from '../config';
import type { SelectionValue, Selections } from '../selections';

/** The option id a colour selection refers to ('custom' for a picked colour). */
export function optionIdOf(value: SelectionValue | undefined): string | undefined {
  if (typeof value === 'object' && value !== null) return 'custom';
  return typeof value === 'string' ? value : undefined;
}

function testLeaf(leaf: ConditionLeaf, value: SelectionValue | undefined): boolean {
  if (typeof leaf.equals === 'boolean') return value === leaf.equals;
  if (typeof leaf.equals === 'string') return optionIdOf(value) === leaf.equals;
  if (leaf.oneOf) return leaf.oneOf.includes(optionIdOf(value) ?? '');
  if (typeof value !== 'number') return false;
  return (
    (leaf.min === undefined || value >= leaf.min) && (leaf.max === undefined || value <= leaf.max)
  );
}

/** Whether `condition` holds for `selections`. */
export function testCondition(condition: Condition, selections: Selections): boolean {
  if ('all' in condition) return condition.all.every((c) => testCondition(c, selections));
  if ('any' in condition) return condition.any.some((c) => testCondition(c, selections));
  if ('not' in condition) return !testCondition(condition.not, selections);
  return testLeaf(condition, selections[condition.group]);
}

/** Group ids a condition looks at. */
export function groupsIn(condition: Condition): string[] {
  if ('all' in condition) return condition.all.flatMap(groupsIn);
  if ('any' in condition) return condition.any.flatMap(groupsIn);
  if ('not' in condition) return groupsIn(condition.not);
  return [condition.group];
}

/**
 * A value for the leaf's group that makes the leaf hold, or undefined if it can't be satisfied
 * directly (e.g. a compound condition, or a custom colour).
 */
export function satisfyingValue(
  condition: Condition,
  config: ProductConfig,
): { group: string; value: SelectionValue } | undefined {
  if ('all' in condition || 'any' in condition || 'not' in condition) return undefined;
  const group: OptionGroup | undefined = config.groups.find((g) => g.id === condition.group);
  if (!group) return undefined;
  if (typeof condition.equals === 'boolean') return { group: group.id, value: condition.equals };
  if (typeof condition.equals === 'string') {
    return condition.equals === 'custom' ? undefined : { group: group.id, value: condition.equals };
  }
  const option = condition.oneOf?.find((o) => o !== 'custom');
  if (option) return { group: group.id, value: option };
  if (group.type !== 'dimension') return undefined;
  if (condition.min !== undefined)
    return { group: group.id, value: Math.max(condition.min, group.min) };
  if (condition.max !== undefined)
    return { group: group.id, value: Math.min(condition.max, group.max) };
  return undefined;
}
