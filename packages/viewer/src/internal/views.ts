import { MathUtils, Spherical, Vector3 } from 'three';

import type { Framing } from './framing';
import { easeOutCubic } from './intro';

import type { CameraView } from '../camera-views';

export { CAMERA_VIEWS, type CameraView } from '../camera-views';

/** Azimuth (degrees around the model, 0 = glTF front, +Z) and elevation (degrees). */
const VIEW_ANGLES: Record<CameraView, { azimuth: number; elevation: number }> = {
  front: { azimuth: 0, elevation: 10 },
  threeQuarter: { azimuth: 35, elevation: 18 },
  side: { azimuth: 90, elevation: 10 },
  back: { azimuth: 180, elevation: 14 },
  top: { azimuth: 25, elevation: 72 },
};

/** Length of a glide between views, in seconds. */
export const VIEW_GLIDE_SECONDS = 0.9;

type Vec3 = readonly [number, number, number];

/**
 * Camera position for a named view, at the model's framing distance. `frontAzimuth` (degrees)
 * says where the model's front faces, for models not exported facing +Z.
 */
export function viewPosition(
  framing: Framing,
  view: CameraView,
  frontAzimuth = 0,
): [number, number, number] {
  const target = new Vector3(...framing.target);
  const distance = new Vector3(...framing.position).distanceTo(target);
  const { azimuth, elevation } = VIEW_ANGLES[view];
  const s = new Spherical(
    distance,
    MathUtils.degToRad(90 - elevation),
    MathUtils.degToRad(azimuth + frontAzimuth),
  );
  return new Vector3().setFromSpherical(s).add(target).toArray();
}

/**
 * Position at progress `t` (0–1) gliding from `from` to `to` around `target`: spherical
 * interpolation along the shorter way round, eased out.
 */
export function glidePosition(
  target: Vec3,
  from: Vec3,
  to: Vec3,
  t: number,
): [number, number, number] {
  const center = new Vector3(...target);
  const a = new Spherical().setFromVector3(new Vector3(...from).sub(center));
  const b = new Spherical().setFromVector3(new Vector3(...to).sub(center));
  let dTheta = b.theta - a.theta;
  dTheta = Math.atan2(Math.sin(dTheta), Math.cos(dTheta)); // shortest way round
  const k = easeOutCubic(t);
  const s = new Spherical(
    a.radius + (b.radius - a.radius) * k,
    a.phi + (b.phi - a.phi) * k,
    a.theta + dTheta * k,
  );
  return new Vector3().setFromSpherical(s).add(center).toArray();
}

/** The camera's angle around `target` in degrees (−180…180, 0 = +Z), as views measure it. */
export function azimuthOf(target: Vec3, position: Vec3): number {
  const degrees = MathUtils.radToDeg(Math.atan2(position[0] - target[0], position[2] - target[2]));
  return Math.round(degrees * 10) / 10;
}
