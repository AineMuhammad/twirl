import { type Box3, MathUtils, Sphere, Vector3 } from 'three';

export interface FramingOptions {
  /** Vertical field of view in degrees. */
  fov: number;
  /** Viewport width / height. */
  aspect: number;
  /** Extra room around the model; 1 = touching the edges. */
  margin?: number;
  /** Horizontal angle around the model, degrees. 0 = looking from +Z (the glTF "front"). */
  azimuth?: number;
  /** Angle above the horizon, degrees. */
  elevation?: number;
}

export interface Framing {
  target: [number, number, number];
  position: [number, number, number];
  near: number;
  far: number;
  minDistance: number;
  maxDistance: number;
  /** Radius of the model's bounding sphere (handy for sizing floors, lights, shadows). */
  radius: number;
}

/** Closest zoom, as a fraction of the framing distance. */
export const MIN_ZOOM_FACTOR = 0.5;
/** Farthest zoom, as a multiple of the framing distance. */
export const MAX_ZOOM_FACTOR = 1.6;

/** Fallback when the box is empty (no geometry): a unit sphere at the origin. */
const EMPTY_RADIUS = 1;

/**
 * Places the camera so the model's bounding sphere fits the narrower of the two fields of view,
 * so tall models on wide screens and wide models on phones both fit.
 */
export function computeFraming(box: Box3, options: FramingOptions): Framing {
  const { fov, aspect, margin = 1.2, azimuth = 35, elevation = 18 } = options;

  const sphere = box.isEmpty()
    ? new Sphere(new Vector3(), EMPTY_RADIUS)
    : box.getBoundingSphere(new Sphere());
  const radius = Math.max(sphere.radius, 1e-3);

  const vFov = MathUtils.degToRad(fov);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * Math.max(aspect, 1e-3));
  const fitFov = Math.min(vFov, hFov);
  const distance = (radius * margin) / Math.sin(fitFov / 2);

  const az = MathUtils.degToRad(azimuth);
  const el = MathUtils.degToRad(elevation);
  const direction = new Vector3(
    Math.sin(az) * Math.cos(el),
    Math.sin(el),
    Math.cos(az) * Math.cos(el),
  );
  const position = sphere.center.clone().addScaledVector(direction, distance);

  return {
    target: sphere.center.toArray(),
    position: position.toArray(),
    near: distance / 100,
    far: distance * 100,
    // Zoom range per model: in to about twice the framed size (never inside the model), out to
    // a little smaller than framed, so the product never becomes a speck.
    minDistance: Math.max(radius * 1.25, distance * MIN_ZOOM_FACTOR),
    maxDistance: distance * MAX_ZOOM_FACTOR,
    radius,
  };
}
