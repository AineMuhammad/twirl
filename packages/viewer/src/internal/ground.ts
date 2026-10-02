import type { Stage } from './stage';

/** Typical camera height when an HDRI is shot, in metres. */
const CAPTURE_HEIGHT_M = 1.7;

/**
 * Size of the ground-projected skybox. Assumes the model is in metres (glTF's unit) so the
 * projected floor has a believable scale; very large models get a proportionally higher
 * "camera" so the ground doesn't look like a tabletop.
 */
export function groundProjection(stage: Stage) {
  const height = Math.max(CAPTURE_HEIGHT_M, stage.radius * 0.8);
  // Far beyond the camera's max zoom distance (≈12× radius) so the dome edge never shows.
  const radius = Math.max(100, stage.radius * 40);
  // The projected ground sits just below the shadow catcher (floorY - 0.2% radius, see Floor) so
  // the catcher's shadow isn't hidden behind it.
  const groundY = stage.floorY - stage.radius * 0.004;
  return { height, radius, y: groundY + height };
}
