import { Color } from 'three';

import type { SceneBackground } from '../scene';

export interface CycloramaSize {
  /** Radius of the flat floor before it starts curving up. */
  floor: number;
  /** Radius of the curved cove joining floor and wall. */
  cove: number;
  /** Height of the vertical wall above the cove. */
  wall: number;
}

/**
 * Sizes the cove from the model's radius. The camera's max zoom-out is ~6.4× the radius from the
 * model's centre, so the bowl (floor + cove ≈ 9× radius) always surrounds it.
 */
export function cycloramaSize(modelRadius: number): CycloramaSize {
  return { floor: modelRadius * 5.5, cove: modelRadius * 3.5, wall: modelRadius * 12 };
}

/**
 * Lathe profile (x = distance from the centre, y = height): flat floor, quarter-circle cove,
 * vertical wall. Points go outward so the lathe's normals face into the bowl.
 */
export function cycloramaProfile(size: CycloramaSize, coveSegments = 24): [number, number][] {
  const points: [number, number][] = [
    [0, 0],
    [size.floor, 0],
  ];
  for (let i = 1; i <= coveSegments; i++) {
    const a = (i / coveSegments) * (Math.PI / 2);
    points.push([size.floor + Math.sin(a) * size.cove, (1 - Math.cos(a)) * size.cove]);
  }
  points.push([size.floor + size.cove, size.cove + size.wall]);
  return points;
}

/**
 * The studio paint colour: mostly the backdrop's lighter tone, a little of its edge tone. Scene
 * lights tint and shade it (warm light makes it warmer), so it starts light.
 */
export function cycloramaColor(background: SceneBackground): string {
  const [a, b] =
    background.type === 'solid'
      ? [background.color, background.color]
      : background.type === 'radial'
        ? [background.inner, background.outer]
        : [background.from, background.to];
  return `#${new Color(a).lerp(new Color(b), 0.2).getHexString()}`;
}
