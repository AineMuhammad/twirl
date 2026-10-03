import { type ProductConfig, type ProductConfigInput, productConfigSchema } from './config';
import { humanizeName, slugify } from './names';

/** The subset of the viewer's mesh tree the generator needs. */
export interface StarterMeshNode {
  /** Node path from the model root, e.g. "0/2/1". */
  id: string;
  name: string;
  hasName: boolean;
  kind: 'mesh' | 'group';
  children: StarterMeshNode[];
}

/** Neutral-to-accent palette offered on every part of a generated config. */
export const STARTER_SWATCHES = [
  { id: 'chalk', label: 'Chalk', color: '#f5f5f4' },
  { id: 'stone', label: 'Stone', color: '#a8a29e' },
  { id: 'charcoal', label: 'Charcoal', color: '#292524' },
  { id: 'sand', label: 'Sand', color: '#d6c4a8' },
  { id: 'terracotta', label: 'Terracotta', color: '#c2410c' },
  { id: 'mustard', label: 'Mustard', color: '#ca8a04' },
  { id: 'sage', label: 'Sage', color: '#84a98c' },
  { id: 'forest', label: 'Forest', color: '#166534' },
  { id: 'teal', label: 'Teal', color: '#0f766e' },
  { id: 'navy', label: 'Navy', color: '#1e3a8a' },
  { id: 'plum', label: 'Plum', color: '#6b21a8' },
  { id: 'rose', label: 'Rose', color: '#be185d' },
] as const;

function collectMeshes(nodes: readonly StarterMeshNode[], out: StarterMeshNode[] = []) {
  for (const node of nodes) {
    if (node.kind === 'mesh') out.push(node);
    collectMeshes(node.children, out);
  }
  return out;
}

/**
 * A valid starting config for a model: every mesh becomes a part with a colour group (starter
 * swatches plus custom) and a show/hide group. Meshes sharing a name become one part (names are
 * how parts reference meshes); unnamed meshes are referenced by node path. No pricing or rules.
 */
export function starterConfig(options: {
  name: string;
  meshTree: readonly StarterMeshNode[];
  currency?: string;
  /** Add a colour and a show/hide option per part (default). Off: parts only, no options. */
  withOptions?: boolean;
}): ProductConfig {
  const parts: ProductConfigInput['parts'] = [];
  const groups: ProductConfigInput['groups'] = [];
  const usedIds = new Set<string>();
  const seenNames = new Set<string>();

  collectMeshes(options.meshTree).forEach((mesh, index) => {
    if (mesh.hasName) {
      if (seenNames.has(mesh.name)) return;
      seenNames.add(mesh.name);
    }
    const label = (mesh.hasName ? humanizeName(mesh.name) : `Part ${index + 1}`).slice(0, 80);
    const base = slugify(label) || `part-${index + 1}`;
    let id = base;
    for (let n = 2; usedIds.has(id); n++) id = `${base}-${n}`;
    usedIds.add(id);

    parts.push({ id, label, meshes: [mesh.hasName ? mesh.name : `#${mesh.id}`] });
    if (options.withOptions === false) return;
    groups.push({
      type: 'color',
      id: `${id}-color`,
      label,
      parts: [id],
      default: null,
      swatches: STARTER_SWATCHES.map((s) => ({ ...s })),
      allowCustom: true,
    });
    groups.push({
      type: 'visibility',
      id: `${id}-visible`,
      label,
      parts: [id],
      default: true,
    });
  });

  return productConfigSchema.parse({
    schemaVersion: 1,
    product: { name: options.name.trim().slice(0, 120) || 'Untitled product' },
    parts,
    groups,
    pricing: { currency: options.currency ?? 'USD', base: 0 },
  } satisfies ProductConfigInput);
}
