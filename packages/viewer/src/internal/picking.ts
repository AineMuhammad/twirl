import type { Intersection, Object3D } from 'three';

import type { NodeId } from './mesh-tree';

export interface PointerSample {
  x: number;
  y: number;
  time: number;
}

/** Max movement (CSS px) and duration (ms) for a press to count as a click rather than an orbit drag. */
export const CLICK_SLOP_PX = 6;
export const CLICK_MAX_MS = 500;

export function isClick(down: PointerSample, up: PointerSample) {
  return (
    Math.hypot(up.x - down.x, up.y - down.y) <= CLICK_SLOP_PX && up.time - down.time <= CLICK_MAX_MS
  );
}

/** True if the object and all its ancestors are visible (three's raycaster ignores `visible`). */
export function isRendered(object: Object3D | null): boolean {
  for (let o = object; o; o = o.parent) if (!o.visible) return false;
  return true;
}

/** The id of the nearest visible mesh hit, or null if the click missed the model. */
export function pickMeshId(
  hits: readonly Intersection[],
  idOf: ReadonlyMap<Object3D, NodeId>,
): NodeId | null {
  for (const hit of hits) {
    const id = idOf.get(hit.object);
    if (id !== undefined && isRendered(hit.object)) return id;
  }
  return null;
}
