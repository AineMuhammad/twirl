import type { Color, Material, Mesh, Object3D } from 'three';

import type { MeshOverride, MeshOverrides } from '../types';
import type { NodeId } from './mesh-tree';

type MaterialSlot = Material | Material[];

function isMesh(object: Object3D): object is Mesh {
  return (object as Mesh).isMesh === true;
}

function asList(slot: MaterialSlot): Material[] {
  return Array.isArray(slot) ? slot : [slot];
}

function colorOf(material: Material): Color | null {
  const color = (material as Material & { color?: Color }).color;
  return color?.isColor ? color : null;
}

/**
 * Finds the value of `key` for `id`, falling back to the closest ancestor that sets it
 * ("1/0/2" → "1/0" → "1"). A node's own override wins over its group's.
 */
export function resolveOverride<K extends keyof MeshOverride>(
  id: NodeId,
  overrides: MeshOverrides,
  key: K,
): MeshOverride[K] | undefined {
  let current: string | null = id;
  while (current !== null) {
    const value = overrides[current]?.[key];
    if (value !== undefined) return value;
    const cut = current.lastIndexOf('/');
    current = cut === -1 ? null : current.slice(0, cut);
  }
  return undefined;
}

/**
 * Applies color overrides to a model without touching shared or cached materials:
 * a mesh gets private clones of its materials the first time it's colored, and gets its
 * originals back (clones disposed) when the override is removed.
 *
 * Note: color multiplies with any base-color texture, so textured parts are tinted.
 */
export class MeshOverrideApplier {
  private readonly originals = new Map<Mesh, MaterialSlot>();

  constructor(private readonly index: ReadonlyMap<NodeId, Object3D>) {}

  apply(overrides: MeshOverrides) {
    for (const [id, object] of this.index) {
      if (!isMesh(object)) continue;
      const color = resolveOverride(id, overrides, 'color');
      if (color === undefined) this.restoreMaterials(object);
      else this.tint(object, color);
    }
  }

  /** Restores every original material and frees the clones. */
  dispose() {
    for (const mesh of [...this.originals.keys()]) this.restoreMaterials(mesh);
  }

  private tint(mesh: Mesh, color: string) {
    if (!this.originals.has(mesh)) {
      this.originals.set(mesh, mesh.material);
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map((m) => m.clone())
        : mesh.material.clone();
    }
    for (const material of asList(mesh.material)) colorOf(material)?.set(color);
  }

  private restoreMaterials(mesh: Mesh) {
    const original = this.originals.get(mesh);
    if (!original) return;
    for (const clone of asList(mesh.material)) clone.dispose();
    mesh.material = original;
    this.originals.delete(mesh);
  }
}
