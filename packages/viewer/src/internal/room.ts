import { Box3, Color, type Matrix4, type Object3D, Vector3 } from 'three';

type Vec3 = [number, number, number];

/** Where a room's lights and product go, read from the anchor nodes its GLB carries. */
export interface RoomAnchors {
  /** The floor point the product stands on (it faces +z, into the room). */
  product: Vec3;
  sun: { position: Vec3; target: Vec3 } | null;
  window: { position: Vec3; target: Vec3; width: number; height: number } | null;
  sconces: Vec3[];
  downlights: { position: Vec3; target: Vec3 }[];
  pendant: Vec3 | null;
}

const vec = (v: unknown): Vec3 | null =>
  Array.isArray(v) && v.length === 3 && v.every((n) => typeof n === 'number') ? (v as Vec3) : null;

/**
 * Reads anchors from the room's nodes (glTF extras land in `userData`): `twirl_anchor` says what
 * a node marks, `target` (glTF coordinates) where it points. Positions are in the room's own space.
 */
export function readRoomAnchors(root: Object3D): RoomAnchors {
  const anchors: RoomAnchors = {
    product: [0, 0, 0],
    sun: null,
    window: null,
    sconces: [],
    downlights: [],
    pendant: null,
  };
  root.updateWorldMatrix(true, true);
  const inverse = root.matrixWorld.clone().invert();
  root.traverse((node) => {
    const kind: unknown = node.userData.twirl_anchor;
    if (typeof kind !== 'string') return;
    const position = node.getWorldPosition(new Vector3()).applyMatrix4(inverse).toArray();
    const target = vec(node.userData.target);
    if (kind === 'product') anchors.product = position;
    else if (kind === 'sun' && target) anchors.sun = { position, target };
    else if (kind === 'window' && target) {
      anchors.window = {
        position,
        target,
        width: Number(node.userData.width) || 1,
        height: Number(node.userData.height) || 1,
      };
    } else if (kind === 'sconce') anchors.sconces.push(position);
    else if (kind === 'downlight' && target) anchors.downlights.push({ position, target });
    else if (kind === 'pendant') anchors.pendant = position;
  });
  return anchors;
}

/**
 * A wall (or the ceiling) that hides itself when the camera is behind it, like a dollhouse, plus
 * whatever hangs on it (art, curtains, the window). All in the room's own space.
 */
export interface RoomShell {
  objects: Object3D[];
  /** The thin axis: 0 = x, 1 = y, 2 = z. */
  axis: 0 | 1 | 2;
  /** The inside face's coordinate on that axis. */
  inner: number;
  /** +1 if the room lies on the positive side of the face, -1 if on the negative side. */
  inward: 1 | -1;
}

const SHELL_NAMES = /^(Wall_|Room_Ceiling)/;
/** Things within this distance of a wall's inside face, entirely, count as hanging on it. */
const ON_WALL_M = 0.45;

function boxOf(object: Object3D, inverse: Matrix4) {
  return new Box3().setFromObject(object).applyMatrix4(inverse);
}

/** Finds the walls and ceiling by name, and what hangs on each. */
export function findRoomShells(root: Object3D): RoomShell[] {
  root.updateWorldMatrix(true, true);
  const inverse = root.matrixWorld.clone().invert();
  const meshes: Object3D[] = [];
  root.traverse((node) => {
    if ((node as { isMesh?: boolean }).isMesh) meshes.push(node);
  });
  const roomBox = new Box3();
  for (const mesh of meshes) roomBox.union(boxOf(mesh, inverse));
  const centre = roomBox.getCenter(new Vector3());

  const shells: RoomShell[] = [];
  for (const mesh of meshes.filter((m) => SHELL_NAMES.test(m.name))) {
    const box = boxOf(mesh, inverse);
    const size = box.getSize(new Vector3()).toArray();
    const axis = size.indexOf(Math.min(...size)) as 0 | 1 | 2;
    const inward: 1 | -1 =
      centre.getComponent(axis) > box.getCenter(new Vector3()).getComponent(axis) ? 1 : -1;
    const inner = inward === 1 ? box.max.getComponent(axis) : box.min.getComponent(axis);
    shells.push({ objects: [mesh], axis, inner, inward });
  }
  // Hang things on the wall they hug.
  for (const mesh of meshes) {
    if (SHELL_NAMES.test(mesh.name) || /Floor/.test(mesh.name)) continue;
    const box = boxOf(mesh, inverse);
    const shell = shells.find((s) => {
      if (s.axis === 1) return false; // nothing hangs from the ceiling this way
      const near = s.inward === 1 ? box.min.getComponent(s.axis) : box.max.getComponent(s.axis);
      const far = s.inward === 1 ? box.max.getComponent(s.axis) : box.min.getComponent(s.axis);
      return Math.abs(near - s.inner) < 0.05 + ON_WALL_M && Math.abs(far - s.inner) < ON_WALL_M;
    });
    shell?.objects.push(mesh);
  }
  return shells;
}

/**
 * The space inside the walls and below the ceiling (room space), shrunk by `margin`: where the
 * camera may go. Null if the room has no walls on some side.
 */
export function roomInterior(shells: RoomShell[], margin: number): Box3 | null {
  const min = [-Infinity, 0, -Infinity];
  const max = [Infinity, Infinity, Infinity];
  for (const shell of shells) {
    if (shell.inward === 1)
      min[shell.axis] = Math.max(min[shell.axis] ?? -Infinity, shell.inner + margin);
    else max[shell.axis] = Math.min(max[shell.axis] ?? Infinity, shell.inner - margin);
  }
  if (![min[0], max[0], min[2], max[2], max[1]].every(Number.isFinite)) return null;
  return new Box3(new Vector3(...(min as Vec3)), new Vector3(...(max as Vec3)));
}

/** Whether a camera at `point` (room space) is behind this shell, so it should be hidden. */
export function isBehindShell(shell: RoomShell, point: Vec3): boolean {
  return (point[shell.axis] - shell.inner) * shell.inward < -0.02;
}

/** Approximate colour of a light at a colour temperature (1000–12000 K). */
export function kelvinToColor(kelvin: number): Color {
  const t = Math.min(12000, Math.max(1000, kelvin)) / 100;
  const r = t <= 66 ? 255 : 329.698727446 * (t - 60) ** -0.1332047592;
  const g =
    t <= 66
      ? 99.4708025861 * Math.log(t) - 161.1195681661
      : 288.1221695283 * (t - 60) ** -0.0755148492;
  const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  const clamp = (v: number) => Math.min(255, Math.max(0, v)) / 255;
  return new Color().setRGB(clamp(r), clamp(g), clamp(b), 'srgb');
}

/** The open side of a room the camera orbits on: up to this far either side of the front. */
export const FRONT_ARC = (110 * Math.PI) / 180;

/**
 * How far the camera may zoom out in a room: the typical free distance from the product across
 * its open side, before the camera would enter furniture (a padded box) or leave the room. Taken
 * as the median over sampled directions, so one cabinet off to the side doesn't cap every angle
 * (whatever still gets in the way fades instead). Room space.
 */
export function freeOrbitDistance(options: {
  target: Vec3;
  keepOut: Box3[];
  interior: Box3 | null;
  minDistance: number;
  maxDistance: number;
}): number {
  const { target, keepOut, interior, minDistance, maxDistance } = options;
  const blocked = (p: Vector3) =>
    (interior !== null && !interior.containsPoint(p)) || keepOut.some((b) => b.containsPoint(p));
  const centre = new Vector3(...target);
  const point = new Vector3();
  const free: number[] = [];
  for (let az = -FRONT_ARC; az <= FRONT_ARC + 1e-6; az += FRONT_ARC / 6) {
    for (const elevation of [0.3, 0.6]) {
      let d = minDistance;
      const dir = new Vector3(
        Math.sin(az) * Math.cos(elevation),
        Math.sin(elevation),
        Math.cos(az) * Math.cos(elevation),
      );
      while (d < maxDistance && !blocked(point.copy(centre).addScaledVector(dir, d + 0.05)))
        d += 0.05;
      free.push(d);
    }
  }
  free.sort((a, b) => a - b);
  const median = free[Math.floor(free.length / 2)] ?? maxDistance;
  return Math.min(maxDistance, Math.max(minDistance + 0.6, median));
}
