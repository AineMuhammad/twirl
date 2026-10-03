import type { Box3 } from 'three';

/** Where the model sits once settled; used to place lights, shadows and the floor. */
export interface Stage {
  center: [number, number, number];
  radius: number;
  floorY: number;
}

export function stageFromBounds(bounds: Box3, radius: number): Stage {
  if (bounds.isEmpty()) return { center: [0, 0, 0], radius, floorY: 0 };
  const center = bounds.getCenter(bounds.min.clone());
  return { center: center.toArray(), radius, floorY: bounds.min.y };
}
