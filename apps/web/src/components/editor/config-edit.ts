import {
  type ColorGroup,
  groupsIn,
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

const STARTER_COLORS = ['#f5f5f4', '#292524', '#b08d57', '#3b5b7a'];

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
}

/** Every mesh in the model, once per reference (meshes sharing a name are one choice). */
export function meshChoices(tree: readonly MeshTreeNode[]): MeshChoice[] {
  const choices = new Map<string, MeshChoice>();
  const walk = (nodes: readonly MeshTreeNode[]) => {
    for (const node of nodes) {
      if (node.kind === 'mesh') {
        const ref = node.hasName ? node.name : `#${node.id}`;
        if (!choices.has(ref)) choices.set(ref, { ref, label: node.name, hasName: node.hasName });
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
    swatches: STARTER_COLORS.map((color, i) => ({
      id: `color-${i + 1}`,
      label: `Colour ${i + 1}`,
      color,
      price: 0,
    })),
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
