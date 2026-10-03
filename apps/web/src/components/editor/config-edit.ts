import {
  type ColorGroup,
  type ConditionLeaf,
  groupsIn,
  humanizeName,
  type OptionGroup,
  type ProductConfig,
  type Rule,
  slugify,
} from '@twirl/config-schema/engine';
import type { MeshTreeNode } from '@twirl/viewer';

/**
 * Pure edits on a product config, used by the editor. Every function returns a new config and
 * leaves the input untouched. Ids are generated once from labels and never change afterwards
 * (saved selections, share links and rules refer to them).
 */

/** A new id from `label`, unique among `taken` (`seat`, `seat-2`, …). */
export function uniqueId(label: string, taken: Iterable<string>, fallback: string): string {
  const used = new Set(taken);
  const base = slugify(label).slice(0, 56) || fallback;
  let id = base;
  for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
  return id;
}

export interface MeshChoice {
  /** How a part references the mesh: its node name, or `#path` when it has none. */
  ref: string;
  label: string;
  hasName: boolean;
  /** A node to highlight in the preview. */
  nodeId: string;
}

/** Every mesh in the model, once per reference (meshes sharing a name are one choice). */
export function meshChoices(tree: readonly MeshTreeNode[]): MeshChoice[] {
  const choices = new Map<string, MeshChoice>();
  const walk = (nodes: readonly MeshTreeNode[]) => {
    for (const node of nodes) {
      if (node.kind === 'mesh') {
        const ref = node.hasName ? node.name : `#${node.id}`;
        if (!choices.has(ref)) {
          choices.set(ref, { ref, label: node.name, hasName: node.hasName, nodeId: node.id });
        }
      }
      walk(node.children);
    }
  };
  walk(tree);
  return [...choices.values()];
}

// ── Parts ──────────────────────────────────────────────────────────────────────────────────

export function addPart(config: ProductConfig, label: string, meshes: string[]): ProductConfig {
  const id = uniqueId(
    label,
    config.parts.map((p) => p.id),
    'part',
  );
  const withoutMeshes = removeMeshes(config, meshes);
  return { ...withoutMeshes, parts: [...withoutMeshes.parts, { id, label, meshes }] };
}

/** The part a mesh belongs to, if any. */
export function partForMesh(config: ProductConfig, ref: string) {
  return config.parts.find((p) => p.meshes.includes(ref));
}

/** A friendly starting name for a mesh: `Pillow_01` → `Pillow 01`. */
export function meshPartName(mesh: MeshChoice, index: number): string {
  return (mesh.hasName ? humanizeName(mesh.label) : `Part ${index + 1}`).slice(0, 80) || 'Part';
}

/** Whether a mesh is part of the product (not hidden). */
export function isMeshShown(config: ProductConfig, ref: string): boolean {
  return !config.hiddenMeshes.includes(ref);
}

/**
 * Shows a mesh (as its own named part) or hides it from the product entirely. Hiding also removes
 * its part from options; options left with no parts are removed.
 */
export function setMeshShown(
  config: ProductConfig,
  mesh: MeshChoice,
  shown: boolean,
  index = 0,
): ProductConfig {
  const hiddenMeshes = config.hiddenMeshes.filter((m) => m !== mesh.ref);
  if (shown) {
    const visible = { ...config, hiddenMeshes };
    return partForMesh(visible, mesh.ref)
      ? visible
      : addPart(visible, meshPartName(mesh, index), [mesh.ref]);
  }
  const withoutPart = partForMesh(config, mesh.ref) ? unassignMesh(config, mesh.ref) : config;
  return { ...withoutPart, hiddenMeshes: [...hiddenMeshes, mesh.ref] };
}

/** Shows or hides every mesh. */
export function setAllShown(
  config: ProductConfig,
  meshes: readonly MeshChoice[],
  shown: boolean,
): ProductConfig {
  return meshes.reduce((c, mesh, i) => setMeshShown(c, mesh, shown, i), config);
}

export function renamePart(config: ProductConfig, id: string, label: string): ProductConfig {
  return { ...config, parts: config.parts.map((p) => (p.id === id ? { ...p, label } : p)) };
}

/** Moves a mesh into a part (a mesh belongs to at most one part). */
export function assignMesh(config: ProductConfig, partId: string, ref: string): ProductConfig {
  const cleared = removeMeshes(config, [ref]);
  return {
    ...cleared,
    parts: cleared.parts.map((p) => (p.id === partId ? { ...p, meshes: [...p.meshes, ref] } : p)),
  };
}

/** Takes a mesh out of its part. A part left without meshes is removed. */
export function unassignMesh(config: ProductConfig, ref: string): ProductConfig {
  const emptied = config.parts.filter((p) => p.meshes.length === 1 && p.meshes[0] === ref);
  const next = removeMeshes(config, [ref]);
  return emptied.reduce((c, p) => removePart(c, p.id), next);
}

function removeMeshes(config: ProductConfig, refs: string[]): ProductConfig {
  const drop = new Set(refs);
  return {
    ...config,
    parts: config.parts.map((p) => ({ ...p, meshes: p.meshes.filter((m) => !drop.has(m)) })),
  };
}

/** Removes a part from the config and from every group; groups left empty are removed too. */
export function removePart(config: ProductConfig, id: string): ProductConfig {
  let next: ProductConfig = { ...config, parts: config.parts.filter((p) => p.id !== id) };
  const emptied: string[] = [];
  next = {
    ...next,
    groups: next.groups.map((g): OptionGroup => {
      if (g.type === 'dimension') {
        const behaviors = g.behaviors.filter((b) => b.part !== id);
        if (behaviors.length === 0) emptied.push(g.id);
        return { ...g, behaviors };
      }
      const parts = g.parts.filter((p) => p !== id);
      if (parts.length === 0) emptied.push(g.id);
      return { ...g, parts };
    }),
  };
  return emptied.reduce(removeGroup, next);
}

// ── Groups ─────────────────────────────────────────────────────────────────────────────────

function groupIds(config: ProductConfig) {
  return config.groups.map((g) => g.id);
}

/** Parts already coloured by a colour group other than `exceptGroup`. */
export function coloredParts(config: ProductConfig, exceptGroup?: string): Set<string> {
  return new Set(
    config.groups.flatMap((g) => (g.type === 'color' && g.id !== exceptGroup ? g.parts : [])),
  );
}

export function addColorGroup(
  config: ProductConfig,
  label: string,
  parts: string[],
): ProductConfig {
  const id = uniqueId(label, groupIds(config), 'color');
  const group: ColorGroup = {
    type: 'color',
    id,
    label,
    parts,
    swatches: [],
    default: null,
    originalLabel: 'Original',
    allowCustom: false,
    customPrice: 0,
  };
  return { ...config, groups: [...config.groups, group] };
}

export function addVisibilityGroup(
  config: ProductConfig,
  label: string,
  parts: string[],
): ProductConfig {
  const id = uniqueId(label, groupIds(config), 'option');
  return {
    ...config,
    groups: [...config.groups, { type: 'visibility', id, label, parts, default: true, price: 0 }],
  };
}

export function updateGroup<G extends OptionGroup>(
  config: ProductConfig,
  id: string,
  update: (group: G) => G,
): ProductConfig {
  return {
    ...config,
    groups: config.groups.map((g) => (g.id === id ? update(g as G) : g)),
  };
}

export function moveGroup(config: ProductConfig, id: string, by: -1 | 1): ProductConfig {
  const from = config.groups.findIndex((g) => g.id === id);
  const to = from + by;
  if (from < 0 || to < 0 || to >= config.groups.length) return config;
  const groups = [...config.groups];
  const [group] = groups.splice(from, 1);
  if (group) groups.splice(to, 0, group);
  return { ...config, groups };
}

function ruleGroups(rule: Rule): string[] {
  if (rule.type === 'requires') return [...groupsIn(rule.when), ...groupsIn(rule.require)];
  if (rule.type === 'excludes') return [...groupsIn(rule.a), ...groupsIn(rule.b)];
  return [...groupsIn(rule.when), rule.target.group];
}

/** Removes a group and any rule that mentions it. */
export function removeGroup(config: ProductConfig, id: string): ProductConfig {
  return {
    ...config,
    groups: config.groups.filter((g) => g.id !== id),
    rules: config.rules.filter((r) => !ruleGroups(r).includes(id)),
  };
}

// ── Swatches ───────────────────────────────────────────────────────────────────────────────

export function addSwatch(group: ColorGroup): ColorGroup {
  const taken = ['original', 'custom', ...group.swatches.map((s) => s.id)];
  const label = `Colour ${group.swatches.length + 1}`;
  return {
    ...group,
    swatches: [
      ...group.swatches,
      { id: uniqueId(label, taken, 'color'), label, color: '#808080', price: 0 },
    ],
  };
}

export function removeSwatch(group: ColorGroup, id: string): ColorGroup {
  return {
    ...group,
    swatches: group.swatches.filter((s) => s.id !== id),
    default: group.default === id ? null : group.default,
  };
}

// ── Money ──────────────────────────────────────────────────────────────────────────────────

/** "49.5" → 4950 (minor units). Null for anything that isn't a number. */
export function parseMoney(text: string): number | null {
  const cleaned = text.replace(/[,\s]/g, '');
  if (!/^-?\d*(\.\d{0,2})?$/.test(cleaned) || cleaned === '' || cleaned === '-') return null;
  return Math.round(Number(cleaned) * 100);
}

/** 4950 → "49.50" for an input field. */
export function moneyInput(minor: number): string {
  return (minor / 100).toFixed(2);
}

// ── Sizes ──────────────────────────────────────────────────────────────────────────────────

export function addDimensionGroup(
  config: ProductConfig,
  label: string,
  parts: string[],
): ProductConfig {
  const id = uniqueId(label, groupIds(config), 'size');
  return {
    ...config,
    groups: [
      ...config.groups,
      {
        type: 'dimension',
        id,
        label,
        unit: 'cm',
        min: 80,
        max: 120,
        step: 5,
        default: 100,
        nativeSize: 100,
        axes: ['x'],
        behaviors: parts.map((part) => ({ part, mode: 'stretch' as const })),
        pricePerStep: 0,
      },
    ],
  };
}

// ── Rules ──────────────────────────────────────────────────────────────────────────────────

/** A sensible first condition on a group: its default value. */
export function defaultCondition(group: OptionGroup): ConditionLeaf {
  if (group.type === 'color') return { group: group.id, equals: group.default ?? 'original' };
  if (group.type === 'visibility') return { group: group.id, equals: true };
  return { group: group.id, min: group.default };
}

export function isLeaf(condition: unknown): condition is ConditionLeaf {
  return typeof condition === 'object' && condition !== null && 'group' in condition;
}

/** Choices a colour condition can name: the original finish, swatches, and custom. */
export function colorOptions(group: ColorGroup): { id: string; label: string }[] {
  return [
    { id: 'original', label: group.originalLabel },
    ...group.swatches.map((s) => ({ id: s.id, label: s.label })),
    ...(group.allowCustom ? [{ id: 'custom', label: 'Custom colour' }] : []),
  ];
}

export function addRule(config: ProductConfig, type: Rule['type']): ProductConfig {
  const [first, second] = config.groups;
  if (!first) return config;
  const other = second ?? first;
  const id = uniqueId(
    `${type}-rule`,
    config.rules.map((r) => r.id),
    'rule',
  );
  const rule: Rule =
    type === 'requires'
      ? {
          type,
          id,
          message: 'This choice needs another option.',
          when: defaultCondition(first),
          require: defaultCondition(other),
        }
      : type === 'excludes'
        ? {
            type,
            id,
            message: "These options can't be combined.",
            a: defaultCondition(first),
            b: defaultCondition(other),
          }
        : {
            type,
            id,
            message: "This option isn't available with your current choices.",
            when: defaultCondition(first),
            target: { group: other.id },
            effect: 'disable',
          };
  return { ...config, rules: [...config.rules, rule] };
}

export function updateRule(
  config: ProductConfig,
  id: string,
  update: (rule: Rule) => Rule,
): ProductConfig {
  return { ...config, rules: config.rules.map((r) => (r.id === id ? update(r) : r)) };
}

export function removeRule(config: ProductConfig, id: string): ProductConfig {
  return { ...config, rules: config.rules.filter((r) => r.id !== id) };
}

// ── Per-part options ───────────────────────────────────────────────────────────────────────

/** The colour option for a part (each part has at most one). */
export function colorGroupOf(config: ProductConfig, partId: string): ColorGroup | undefined {
  return config.groups.find((g): g is ColorGroup => g.type === 'color' && g.parts.includes(partId));
}

/** The show/hide option for a part, if it has one. */
export function visibilityGroupOf(config: ProductConfig, partId: string) {
  return config.groups.find(
    (g): g is Extract<OptionGroup, { type: 'visibility' }> =>
      g.type === 'visibility' && g.parts.includes(partId),
  );
}

/** Lets shoppers change a part's colour, or stops them (removing that option and its rules). */
export function setPartColorable(config: ProductConfig, partId: string, on: boolean) {
  const existing = colorGroupOf(config, partId);
  const part = config.parts.find((p) => p.id === partId);
  if (on)
    return existing || !part ? config : addColorGroup(config, `${part.label} colour`, [partId]);
  return existing ? removeGroup(config, existing.id) : config;
}

/** Lets shoppers remove a part, or stops them (removing that option and its rules). */
export function setPartHideable(config: ProductConfig, partId: string, on: boolean) {
  const existing = visibilityGroupOf(config, partId);
  const part = config.parts.find((p) => p.id === partId);
  if (on) return existing || !part ? config : addVisibilityGroup(config, part.label, [partId]);
  return existing ? removeGroup(config, existing.id) : config;
}

/** A part is customisable when shoppers can change its colour or remove it. */
export function isPartCustomisable(config: ProductConfig, partId: string): boolean {
  return Boolean(colorGroupOf(config, partId) || visibilityGroupOf(config, partId));
}

/**
 * Makes a part customisable (starting with a colour option offering only its original finish) or
 * fixed (removing its colour and show/hide options).
 */
export function setPartCustomisable(config: ProductConfig, partId: string, on: boolean) {
  if (on)
    return isPartCustomisable(config, partId) ? config : setPartColorable(config, partId, true);
  return setPartHideable(setPartColorable(config, partId, false), partId, false);
}
