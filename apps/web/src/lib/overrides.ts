import type { MeshOverride, MeshOverrides } from '@twirl/viewer';

/** Swatches offered for every part in the demo (merchant-defined swatches come in M2). */
export const DEMO_SWATCHES = [
  { name: 'Chalk', hex: '#f5f5f4' },
  { name: 'Stone', hex: '#a8a29e' },
  { name: 'Charcoal', hex: '#292524' },
  { name: 'Sand', hex: '#d6c4a8' },
  { name: 'Terracotta', hex: '#c2410c' },
  { name: 'Mustard', hex: '#ca8a04' },
  { name: 'Sage', hex: '#84a98c' },
  { name: 'Forest', hex: '#166534' },
  { name: 'Teal', hex: '#0f766e' },
  { name: 'Navy', hex: '#1e3a8a' },
  { name: 'Plum', hex: '#6b21a8' },
  { name: 'Rose', hex: '#be185d' },
] as const;

/**
 * Returns new overrides with `patch` merged into `id`'s entry. `undefined` in the patch clears
 * that field; an entry left empty is removed. Never mutates the input.
 */
export function patchOverride(
  overrides: MeshOverrides,
  id: string,
  patch: { [K in keyof MeshOverride]?: MeshOverride[K] | undefined },
): MeshOverrides {
  const merged = { ...overrides[id], ...patch };
  const next: MeshOverride = {};
  if (merged.color !== undefined) next.color = merged.color;
  if (merged.visible !== undefined) next.visible = merged.visible;
  const rest = Object.fromEntries(Object.entries(overrides).filter(([key]) => key !== id));
  return Object.keys(next).length > 0 ? { ...rest, [id]: next } : rest;
}

export function isHidden(overrides: MeshOverrides, id: string) {
  return overrides[id]?.visible === false;
}
