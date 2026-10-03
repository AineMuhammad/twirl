/**
 * Key light strength from how dominant the brightest region is: a clear sun or strong lamp gets
 * a strong light (crisp shadow), overcast or diffuse light a weak one (faint shadow).
 */
export function keyIntensityFor(dominance: number): number {
  const t = Math.min(1, Math.max(0, (dominance - 2) / 18));
  return 0.25 + t * 2.25;
}

/** Minimum elevation for the shadow-casting light. Real low suns and side windows cast shadows
 * far from the product; product photography keeps the key light high. */
export const MIN_KEY_ELEVATION_DEG = 35;

/** Keeps the detected light's compass direction but raises it to at least `minDeg` elevation. */
export function raiseToMinElevation(
  [x, y, z]: readonly [number, number, number],
  minDeg = MIN_KEY_ELEVATION_DEG,
): [number, number, number] {
  const length = Math.hypot(x, y, z) || 1;
  const elevation = Math.asin(Math.max(-1, Math.min(1, y / length)));
  const min = (minDeg * Math.PI) / 180;
  if (elevation >= min) return [x / length, y / length, z / length];
  const horizontal = Math.hypot(x, z);
  if (horizontal === 0) return [0, 1, 0];
  const scale = Math.cos(min) / horizontal;
  return [x * scale, Math.sin(min), z * scale];
}
