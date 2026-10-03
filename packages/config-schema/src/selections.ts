import type { ColorGroup, DimensionGroup, OptionGroup, ProductConfig } from './config';

/**
 * A shopper's choice for one group:
 * - colour: a swatch id, 'original' (the model's own finish) or `{ custom: '#rrggbb' }`
 * - visibility: true / false
 * - dimension: a number in the group's unit
 *
 * This module is zod-free so the engine can run in the storefront without the schema library;
 * the matching zod schemas live in `selections-schema.ts`.
 */
export type SelectionValue = string | boolean | number | { custom: string };

/** Choices keyed by group id. */
export type Selections = Record<string, SelectionValue>;

const HEX = /^#[0-9a-f]{6}$/i;

/** `{ custom: '#rrggbb' }` with nothing else, normalised to lowercase. */
export function parseCustomColor(value: unknown): { custom: string } | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const keys = Object.keys(value);
  const custom = (value as { custom?: unknown }).custom;
  if (keys.length !== 1 || typeof custom !== 'string' || !HEX.test(custom)) return null;
  return { custom: custom.toLowerCase() };
}

export type SelectionAdjustment =
  | { group: string; reason: 'unknown-group' }
  | { group: string; reason: 'invalid-value'; value: unknown }
  | { group: string; reason: 'custom-not-allowed' }
  | { group: string; reason: 'out-of-range' | 'off-step'; from: number; to: number };

export interface ResolvedSelections {
  /** One valid value for every group. */
  selections: Selections;
  /** What had to change (empty when the input was complete and valid). */
  adjustments: SelectionAdjustment[];
}

/** The default choice for a group. */
export function defaultValue(group: OptionGroup): SelectionValue {
  if (group.type === 'color') return group.default ?? 'original';
  return group.default;
}

/** Every group at its default. */
export function defaultSelections(config: ProductConfig): Selections {
  return Object.fromEntries(config.groups.map((g) => [g.id, defaultValue(g)]));
}

/** Clamps to [min, max] and snaps to the nearest step (from min). */
export function snapDimension(group: DimensionGroup, value: number): number {
  const clamped = Math.min(group.max, Math.max(group.min, value));
  const steps = Math.round((clamped - group.min) / group.step);
  // Round away floating-point noise (e.g. 0.1 + 0.2) to the step's precision.
  const decimals = (group.step.toString().split('.')[1] ?? '').length;
  return Number((group.min + steps * group.step).toFixed(decimals));
}

function resolveColor(group: ColorGroup, value: unknown, adjustments: SelectionAdjustment[]) {
  if (value === 'original') return value;
  if (typeof value === 'string' && group.swatches.some((s) => s.id === value)) return value;
  const custom = parseCustomColor(value);
  if (custom) {
    if (group.allowCustom) return custom;
    adjustments.push({ group: group.id, reason: 'custom-not-allowed' });
    return defaultValue(group);
  }
  adjustments.push({ group: group.id, reason: 'invalid-value', value });
  return defaultValue(group);
}

function resolveDimension(
  group: DimensionGroup,
  value: unknown,
  adjustments: SelectionAdjustment[],
) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    adjustments.push({ group: group.id, reason: 'invalid-value', value });
    return group.default;
  }
  const snapped = snapDimension(group, value);
  if (snapped !== value) {
    const inRange = value >= group.min && value <= group.max;
    adjustments.push({
      group: group.id,
      reason: inRange ? 'off-step' : 'out-of-range',
      from: value,
      to: snapped,
    });
  }
  return snapped;
}

/**
 * Makes untrusted selections (from the UI, a share link or an old saved config) structurally
 * valid for `config`: fills missing groups with defaults, drops unknown groups, replaces
 * invalid values and snaps dimensions. Rule-based corrections happen in the engine.
 */
export function resolveSelections(config: ProductConfig, input: unknown): ResolvedSelections {
  const adjustments: SelectionAdjustment[] = [];
  const raw: Record<string, unknown> =
    typeof input === 'object' && input !== null && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};
  const groupIds = new Set(config.groups.map((g) => g.id));
  for (const key of Object.keys(raw)) {
    if (!groupIds.has(key)) adjustments.push({ group: key, reason: 'unknown-group' });
  }

  const selections: Selections = {};
  for (const group of config.groups) {
    const value = raw[group.id];
    if (value === undefined) {
      selections[group.id] = defaultValue(group);
    } else if (group.type === 'color') {
      selections[group.id] = resolveColor(group, value, adjustments);
    } else if (group.type === 'visibility') {
      if (typeof value === 'boolean') selections[group.id] = value;
      else {
        adjustments.push({ group: group.id, reason: 'invalid-value', value });
        selections[group.id] = group.default;
      }
    } else {
      selections[group.id] = resolveDimension(group, value, adjustments);
    }
  }
  return { selections, adjustments };
}
