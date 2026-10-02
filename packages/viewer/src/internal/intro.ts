import { Spherical, Vector3 } from 'three';

/** Length of the load-in camera move, in seconds. */
export const INTRO_SECONDS = 1.2;
/** The move starts this much further out than the final framing... */
export const INTRO_DISTANCE_SCALE = 1.3;
/** ...and this far around the model (radians), so it reads as a gentle orbit-in. */
export const INTRO_AZIMUTH_OFFSET = -0.45;

export function easeOutCubic(t: number) {
  const c = Math.min(1, Math.max(0, t));
  return 1 - (1 - c) ** 3;
}

type Vec3 = readonly [number, number, number];

/**
 * Camera position along the intro arc at progress `t` (0–1), interpolated in spherical
 * coordinates around `target` so the camera orbits and dollies in rather than sliding straight.
 */
export function introPosition(
  target: Vec3,
  finalPosition: Vec3,
  t: number,
): [number, number, number] {
  const center = new Vector3(...target);
  const end = new Spherical().setFromVector3(new Vector3(...finalPosition).sub(center));
  const k = easeOutCubic(t);
  const s = new Spherical(
    end.radius * (INTRO_DISTANCE_SCALE + (1 - INTRO_DISTANCE_SCALE) * k),
    end.phi,
    end.theta + INTRO_AZIMUTH_OFFSET * (1 - k),
  );
  return new Vector3().setFromSpherical(s).add(center).toArray();
}
