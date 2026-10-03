import { z } from 'zod';

import { CAMERA_VIEWS, DEFAULT_SCENE } from './constants';
import { sceneSchema } from './look';
import { currencySchema, hexColorSchema, idSchema, labelSchema, moneySchema } from './primitives';

// ── Parts ───────────────────────────────────────────────────────────────────────────────────

/**
 * A named, configurable piece of the product. `meshes` reference glTF node names (stable across
 * re-exports); an entry starting with `#` is a node path (`#0/2/1`) for unnamed nodes.
 */
export const partSchema = z.object({
  id: idSchema,
  label: labelSchema,
  meshes: z.array(z.string().min(1)).min(1),
});
export type Part = z.output<typeof partSchema>;

/** Colour choices that aren't swatches: the model's own finish and a picked colour. */
export const RESERVED_OPTION_IDS = ['original', 'custom'] as const;
export type ReservedOptionId = (typeof RESERVED_OPTION_IDS)[number];

// ── Option groups ───────────────────────────────────────────────────────────────────────────

export const swatchSchema = z.object({
  id: idSchema,
  label: labelSchema,
  color: hexColorSchema,
  /** Price change when chosen (minor units). */
  price: moneySchema.default(0),
});
export type Swatch = z.output<typeof swatchSchema>;

const groupBase = {
  id: idSchema,
  label: labelSchema,
  description: z.string().trim().max(240).optional(),
};

/** Pick a colour for one or more parts. */
export const colorGroupSchema = z.object({
  ...groupBase,
  type: z.literal('color'),
  parts: z.array(idSchema).min(1),
  /** Colours besides the model's own finish (which is always offered). May start empty. */
  swatches: z.array(swatchSchema).default([]),
  /** A swatch id, or null to keep the model's original finish. */
  default: idSchema.nullable(),
  /** Name of the model's original finish, shown as its own choice (e.g. "Matte black"). */
  originalLabel: labelSchema.default('Original'),
  /** Allow any colour via a picker. */
  allowCustom: z.boolean().default(false),
  /** Price change for a custom colour. */
  customPrice: moneySchema.default(0),
});

/** Show or hide one or more parts together (accessories, optional pieces). */
export const visibilityGroupSchema = z.object({
  ...groupBase,
  type: z.literal('visibility'),
  parts: z.array(idSchema).min(1),
  default: z.boolean(),
  /** Price change while the parts are shown. */
  price: moneySchema.default(0),
});

export const DIMENSION_UNITS = ['mm', 'cm', 'm', 'in'] as const;
export const AXES = ['x', 'y', 'z'] as const;
export type Axis = (typeof AXES)[number];

/**
 * A size parameter. The model is scaled along `axes` by `value / nativeSize`; each listed part
 * either stretches with it or is anchored (moves with it without resizing). Unlisted parts stay
 * fixed. See ADR "dimension behaviours".
 */
export const dimensionGroupSchema = z.object({
  ...groupBase,
  type: z.literal('dimension'),
  unit: z.enum(DIMENSION_UNITS),
  min: z.number().positive(),
  max: z.number().positive(),
  step: z.number().positive(),
  default: z.number().positive(),
  axes: z.array(z.enum(AXES)).min(1).max(3),
  /** The model's size along `axes` at its authored scale, in `unit`. */
  nativeSize: z.number().positive(),
  behaviors: z.array(z.object({ part: idSchema, mode: z.enum(['stretch', 'anchor']) })).min(1),
  /** Price change per step away from `default` (minor units): smaller is cheaper, larger dearer. */
  pricePerStep: moneySchema.default(0),
});

export const optionGroupSchema = z.discriminatedUnion('type', [
  colorGroupSchema,
  visibilityGroupSchema,
  dimensionGroupSchema,
]);
export type OptionGroup = z.output<typeof optionGroupSchema>;
export type ColorGroup = z.output<typeof colorGroupSchema>;
export type VisibilityGroup = z.output<typeof visibilityGroupSchema>;
export type DimensionGroup = z.output<typeof dimensionGroupSchema>;

// ── Rules ───────────────────────────────────────────────────────────────────────────────────

/** A condition on one group's selection. Exactly one comparator. */
export type ConditionLeaf = {
  group: string;
  /** Colour: a swatch id ('original' or 'custom' for those choices). Visibility: true/false. */
  equals?: string | boolean;
  /** Colour: any of these swatch ids. */
  oneOf?: string[];
  /** Dimension: value ≥ min. */
  min?: number;
  /** Dimension: value ≤ max. */
  max?: number;
};
export type Condition =
  ConditionLeaf | { all: Condition[] } | { any: Condition[] } | { not: Condition };

const conditionLeafSchema = z
  .object({
    group: idSchema,
    equals: z.union([z.string(), z.boolean()]).optional(),
    oneOf: z.array(z.string()).min(1).optional(),
    min: z.number().optional(),
    max: z.number().optional(),
  })
  .strict()
  .refine(
    (c) => [c.equals, c.oneOf, c.min ?? c.max].filter((v) => v !== undefined).length === 1,
    'A condition needs exactly one of: equals, oneOf, or min/max.',
  );

export const conditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    conditionLeafSchema,
    z.object({ all: z.array(conditionSchema).min(1) }).strict(),
    z.object({ any: z.array(conditionSchema).min(1) }).strict(),
    z.object({ not: conditionSchema }).strict(),
  ]),
) as z.ZodType<Condition>;

const ruleBase = {
  id: idSchema,
  /** Shopper-facing explanation, e.g. "Brass frames aren't available with terracotta fabric." */
  message: z.string().trim().min(1).max(200),
};

export const ruleSchema = z.discriminatedUnion('type', [
  /** When `when` holds, `require` must hold too. */
  z.object({
    ...ruleBase,
    type: z.literal('requires'),
    when: conditionSchema,
    require: conditionSchema,
  }),
  /** `a` and `b` can't both hold. */
  z.object({ ...ruleBase, type: z.literal('excludes'), a: conditionSchema, b: conditionSchema }),
  /** While `when` holds, the target group (or some of its options) is hidden or disabled. */
  z.object({
    ...ruleBase,
    type: z.literal('availability'),
    when: conditionSchema,
    target: z.object({ group: idSchema, options: z.array(z.string()).min(1).optional() }),
    effect: z.enum(['hide', 'disable']),
  }),
]);
export type Rule = z.output<typeof ruleSchema>;

// ── Pricing & presentation ──────────────────────────────────────────────────────────────────

export const pricingSchema = z.object({
  currency: currencySchema,
  /** Price of the default configuration (minor units). Option prices are relative to it. */
  base: moneySchema.min(0),
});

export const LAYOUTS = ['sidebar', 'bottomBar', 'fullscreen'] as const;
export const FONTS = ['geist', 'instrument-serif'] as const;

export const presentationSchema = z.object({
  layout: z.enum(LAYOUTS).default('sidebar'),
  theme: z
    .object({
      accent: hexColorSchema.default('#4f46e5'),
      font: z.enum(FONTS).default('geist'),
      logoUrl: z.url().optional(),
    })
    .prefault({}),
  camera: z.object({ initialView: z.enum(CAMERA_VIEWS).default('threeQuarter') }).prefault({}),
});

// ── Product config ──────────────────────────────────────────────────────────────────────────

export const productConfigSchema = z
  .object({
    schemaVersion: z.literal(1),
    product: z.object({
      name: z.string().trim().min(1).max(120),
      description: z.string().trim().max(2000).optional(),
    }),
    parts: z.array(partSchema),
    /** Meshes (names or `#path`) hidden from the model entirely, e.g. props from the source file. */
    hiddenMeshes: z.array(z.string().min(1)).default([]),
    groups: z.array(optionGroupSchema),
    pricing: pricingSchema,
    rules: z.array(ruleSchema).default([]),
    scene: sceneSchema.default(DEFAULT_SCENE),
    presentation: presentationSchema.prefault({}),
  })
  .superRefine((config, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: 'custom', path, message });

    const hidden = new Set(config.hiddenMeshes);
    const partIds = new Set<string>();
    config.parts.forEach((part, i) => {
      for (const mesh of part.meshes) {
        if (hidden.has(mesh))
          issue(['parts', i, 'meshes'], `"${mesh}" is hidden, so it can't be in a part.`);
      }
      if (partIds.has(part.id)) issue(['parts', i, 'id'], `Duplicate part id "${part.id}".`);
      partIds.add(part.id);
    });

    const groupIds = new Set<string>();
    const coloredBy = new Map<string, string>();
    config.groups.forEach((group, gi) => {
      if (groupIds.has(group.id)) issue(['groups', gi, 'id'], `Duplicate group id "${group.id}".`);
      groupIds.add(group.id);

      const parts = group.type === 'dimension' ? group.behaviors.map((b) => b.part) : group.parts;
      parts.forEach((part, pi) => {
        if (!partIds.has(part)) issue(['groups', gi, 'parts', pi], `Unknown part "${part}".`);
      });

      if (group.type === 'color') {
        for (const part of group.parts) {
          const other = coloredBy.get(part);
          if (other)
            issue(['groups', gi, 'parts'], `Part "${part}" is already coloured by "${other}".`);
          coloredBy.set(part, group.id);
        }
        const swatchIds = new Set<string>();
        group.swatches.forEach((s, si) => {
          if (RESERVED_OPTION_IDS.includes(s.id as ReservedOptionId)) {
            issue(['groups', gi, 'swatches', si, 'id'], `"${s.id}" is reserved.`);
          }
          if (swatchIds.has(s.id))
            issue(['groups', gi, 'swatches', si, 'id'], `Duplicate swatch "${s.id}".`);
          swatchIds.add(s.id);
        });
        if (group.default !== null && !swatchIds.has(group.default)) {
          issue(['groups', gi, 'default'], `Default "${group.default}" isn't one of the swatches.`);
        }
      }

      if (group.type === 'dimension') {
        const { min, max, step } = group;
        if (min >= max) issue(['groups', gi, 'max'], 'max must be greater than min.');
        if (group.default < min || group.default > max) {
          issue(['groups', gi, 'default'], 'default must be between min and max.');
        }
        const onStep = (v: number) =>
          Math.abs((v - min) / step - Math.round((v - min) / step)) < 1e-6;
        if (!onStep(max))
          issue(['groups', gi, 'step'], '(max − min) must be a whole number of steps.');
        if (!onStep(group.default))
          issue(['groups', gi, 'default'], 'default must land on a step.');
        const seen = new Set<string>();
        group.behaviors.forEach((b, bi) => {
          if (seen.has(b.part))
            issue(['groups', gi, 'behaviors', bi], `Part "${b.part}" listed twice.`);
          seen.add(b.part);
        });
      }
    });

    const groupById = new Map(config.groups.map((g) => [g.id, g]));
    const checkCondition = (c: Condition, path: (string | number)[]) => {
      if ('all' in c) return c.all.forEach((x, i) => checkCondition(x, [...path, 'all', i]));
      if ('any' in c) return c.any.forEach((x, i) => checkCondition(x, [...path, 'any', i]));
      if ('not' in c) return checkCondition(c.not, [...path, 'not']);
      const group = groupById.get(c.group);
      if (!group) return issue([...path, 'group'], `Unknown group "${c.group}".`);
      const swatchIds =
        group.type === 'color'
          ? new Set([...group.swatches.map((s) => s.id), ...RESERVED_OPTION_IDS])
          : null;
      if (c.oneOf || typeof c.equals === 'string') {
        if (!swatchIds) return issue(path, `"${c.group}" isn't a colour group.`);
        for (const id of c.oneOf ?? [c.equals as string]) {
          if (!swatchIds.has(id)) issue(path, `"${id}" isn't an option of "${c.group}".`);
        }
      }
      if (typeof c.equals === 'boolean' && group.type !== 'visibility') {
        issue(path, `"${c.group}" isn't a show/hide group.`);
      }
      if ((c.min !== undefined || c.max !== undefined) && group.type !== 'dimension') {
        issue(path, `"${c.group}" isn't a dimension.`);
      }
    };

    const ruleIds = new Set<string>();
    config.rules.forEach((rule, ri) => {
      if (ruleIds.has(rule.id)) issue(['rules', ri, 'id'], `Duplicate rule id "${rule.id}".`);
      ruleIds.add(rule.id);
      const path = ['rules', ri];
      if (rule.type === 'requires') {
        checkCondition(rule.when, [...path, 'when']);
        checkCondition(rule.require, [...path, 'require']);
      } else if (rule.type === 'excludes') {
        checkCondition(rule.a, [...path, 'a']);
        checkCondition(rule.b, [...path, 'b']);
      } else {
        checkCondition(rule.when, [...path, 'when']);
        const target = groupById.get(rule.target.group);
        if (!target) issue([...path, 'target', 'group'], `Unknown group "${rule.target.group}".`);
        else if (rule.target.options) {
          if (target.type !== 'color')
            issue([...path, 'target'], 'Only colour options can be targeted.');
          else {
            const ids = new Set(target.swatches.map((s) => s.id));
            rule.target.options.forEach((o) => {
              if (!ids.has(o)) issue([...path, 'target', 'options'], `"${o}" isn't an option.`);
            });
          }
        }
      }
    });
  });

export type ProductConfig = z.output<typeof productConfigSchema>;
export type ProductConfigInput = z.input<typeof productConfigSchema>;
