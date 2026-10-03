import type { ProductConfig, Selections } from '@twirl/config-schema/engine';

import type { MeshOverrides, MeshTreeNode } from '../types';

/**
 * Node ids for each mesh reference: a node name matches every named node with that name; `#path`
 * matches the node with that id (how unnamed meshes are referenced).
 */
export function nodeIdsByMesh(meshTree: readonly MeshTreeNode[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  const add = (key: string, id: string) => map.set(key, [...(map.get(key) ?? []), id]);
  const walk = (nodes: readonly MeshTreeNode[]) => {
    for (const node of nodes) {
      add(`#${node.id}`, node.id);
      if (node.hasName) add(node.name, node.id);
      walk(node.children);
    }
  };
  walk(meshTree);
  return map;
}

/** Part id → node ids. Parts whose meshes aren't in the model map to an empty list. */
export function partNodeIds(
  config: ProductConfig,
  meshTree: readonly MeshTreeNode[],
): Map<string, string[]> {
  const byMesh = nodeIdsByMesh(meshTree);
  return new Map(
    config.parts.map((part) => [
      part.id,
      [...new Set(part.meshes.flatMap((mesh) => byMesh.get(mesh) ?? []))],
    ]),
  );
}

/** The colour a colour-group value paints, or undefined for the model's original finish. */
export function colorFor(config: ProductConfig, groupId: string, value: unknown) {
  const group = config.groups.find((g) => g.id === groupId);
  if (group?.type !== 'color') return undefined;
  if (typeof value === 'object' && value !== null && 'custom' in value) {
    return (value as { custom: string }).custom;
  }
  return group.swatches.find((s) => s.id === value)?.color;
}

/**
 * The viewer's mesh overrides for (rule-corrected) selections: colour groups paint their parts,
 * hidden visibility groups hide theirs. Dimension groups don't change appearance yet.
 */
export function overridesForSelections(
  config: ProductConfig,
  selections: Selections,
  meshTree: readonly MeshTreeNode[],
): MeshOverrides {
  const nodes = partNodeIds(config, meshTree);
  const overrides: MeshOverrides = {};
  const patch = (partIds: readonly string[], value: { color?: string; visible?: boolean }) => {
    for (const id of partIds.flatMap((p) => nodes.get(p) ?? [])) {
      overrides[id] = { ...overrides[id], ...value };
    }
  };
  for (const group of config.groups) {
    const value = selections[group.id];
    if (group.type === 'color') {
      const color = colorFor(config, group.id, value);
      if (color) patch(group.parts, { color });
    } else if (group.type === 'visibility' && value === false) {
      patch(group.parts, { visible: false });
    }
  }
  return overrides;
}
