import { Color, type Material, type Mesh, type Object3D } from 'three';

import type { MeshOverride, MeshOverrides } from '../types';
import type { NodeId } from './mesh-tree';
import { prepareForTint } from './tint';

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
 * Applies color and visibility overrides to a model without touching shared or cached materials:
 * a mesh gets private clones of its materials the first time it's colored, and gets its
 * originals back (clones disposed) when the override is removed.
 *
 * Textured parts keep their texture's light/dark detail but take the chosen color (see tint.ts).
 */
interface Fade {
  from: Color;
  to: Color;
  elapsed: number;
}

export class MeshOverrideApplier {
  private readonly originals = new Map<Mesh, MaterialSlot>();
  private readonly originalVisibility = new Map<Object3D, boolean>();
  private readonly fades = new Map<Material, Fade>();
  /** Meshes fading back to their original colour, restored when the fade ends. */
  private readonly restoring = new Set<Mesh>();

  /**
   * @param fadeSeconds Colour changes cross-fade over this long (0 = instant, e.g. for reduced
   * motion). Call `step()` every frame while fading.
   */
  constructor(
    private readonly index: ReadonlyMap<NodeId, Object3D>,
    private readonly fadeSeconds = 0,
  ) {}

  apply(overrides: MeshOverrides) {
    for (const [id, object] of this.index) {
      // Visibility applies to the node itself; three.js hides a hidden group's subtree.
      this.setVisibility(object, overrides[id]?.visible);
      if (!isMesh(object)) continue;
      const color = resolveOverride(id, overrides, 'color');
      if (color === undefined) this.fadeBack(object);
      else this.tint(object, color);
    }
  }

  /** True while any colour fade is running. */
  get fading() {
    return this.fades.size > 0;
  }

  /** Advances colour fades by `delta` seconds. */
  step(delta: number) {
    for (const [material, fade] of this.fades) {
      fade.elapsed = Math.min(this.fadeSeconds, fade.elapsed + delta);
      const t = this.fadeSeconds > 0 ? fade.elapsed / this.fadeSeconds : 1;
      // Smoothstep easing; colours are linear, so the blend is perceptually even.
      colorOf(material)?.lerpColors(fade.from, fade.to, t * t * (3 - 2 * t));
      if (t >= 1) this.fades.delete(material);
    }
    for (const mesh of this.restoring) {
      if (asList(mesh.material).some((m) => this.fades.has(m))) continue;
      this.restoring.delete(mesh);
      this.restoreMaterials(mesh);
    }
  }

  /** Restores every original material and visibility, and frees the clones. */
  dispose() {
    this.fades.clear();
    this.restoring.clear();
    for (const mesh of [...this.originals.keys()]) this.restoreMaterials(mesh);
    for (const object of [...this.originalVisibility.keys()]) this.setVisibility(object, undefined);
  }

  private setVisibility(object: Object3D, visible: boolean | undefined) {
    if (visible === undefined) {
      const original = this.originalVisibility.get(object);
      if (original === undefined) return;
      object.visible = original;
      this.originalVisibility.delete(object);
      return;
    }
    if (!this.originalVisibility.has(object)) this.originalVisibility.set(object, object.visible);
    object.visible = visible;
  }

  private tint(mesh: Mesh, color: string) {
    this.restoring.delete(mesh);
    if (!this.originals.has(mesh)) {
      this.originals.set(mesh, mesh.material);
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map((m) => m.clone())
        : mesh.material.clone();
    }
    for (const material of asList(mesh.material)) {
      // Make texture/vertex colors show the chosen color rather than mostly their own.
      prepareForTint(material, mesh);
      this.fadeTo(material, new Color(color));
    }
  }

  /** Fades an overridden mesh back to its original colour, then restores its material. */
  private fadeBack(mesh: Mesh) {
    const original = this.originals.get(mesh);
    if (!original || this.restoring.has(mesh)) return;
    if (this.fadeSeconds <= 0) {
      this.restoreMaterials(mesh);
      return;
    }
    const originals = asList(original);
    asList(mesh.material).forEach((material, i) => {
      const target = colorOf(originals[i] ?? originals[0] ?? material);
      if (target) this.fadeTo(material, target.clone());
    });
    this.restoring.add(mesh);
  }

  private fadeTo(material: Material, to: Color) {
    const current = colorOf(material);
    if (!current) return;
    if (this.fadeSeconds <= 0) {
      current.copy(to);
      this.fades.delete(material);
      return;
    }
    const existing = this.fades.get(material);
    if (existing?.to.equals(to)) return; // already heading there
    this.fades.set(material, { from: current.clone(), to, elapsed: 0 });
  }

  private restoreMaterials(mesh: Mesh) {
    const original = this.originals.get(mesh);
    if (!original) return;
    for (const clone of asList(mesh.material)) {
      this.fades.delete(clone);
      clone.dispose();
    }
    mesh.material = original;
    this.originals.delete(mesh);
  }
}
