import { Box3, MathUtils, PerspectiveCamera, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import { computeFraming, MAX_ZOOM_FACTOR, MIN_ZOOM_FACTOR } from './framing';

const unitBox = () => new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));

/** True if every corner of `box` projects inside the camera's view (NDC within ±1). */
function fitsInView(box: Box3, fov: number, aspect: number) {
  const f = computeFraming(box, { fov, aspect });
  const camera = new PerspectiveCamera(fov, aspect, f.near, f.far);
  camera.position.fromArray(f.position);
  camera.lookAt(new Vector3().fromArray(f.target));
  camera.updateMatrixWorld();
  const corners = [0, 1].flatMap((x) =>
    [0, 1].flatMap((y) =>
      [0, 1].map(
        (z) =>
          new Vector3(
            x ? box.max.x : box.min.x,
            y ? box.max.y : box.min.y,
            z ? box.max.z : box.min.z,
          ),
      ),
    ),
  );
  return corners.every((c) => {
    const p = c.project(camera);
    return Math.abs(p.x) <= 1 && Math.abs(p.y) <= 1;
  });
}

describe('computeFraming', () => {
  it('targets the center of the box', () => {
    const box = new Box3(new Vector3(2, 0, -1), new Vector3(4, 2, 1));
    expect(computeFraming(box, { fov: 35, aspect: 1 }).target).toEqual([3, 1, 0]);
  });

  it.each([
    ['landscape desktop', 16 / 9],
    ['square', 1],
    ['portrait phone', 9 / 19.5],
  ])('keeps the whole model in view on a %s viewport', (_, aspect) => {
    expect(fitsInView(unitBox(), 35, aspect)).toBe(true);
    // A long, flat model (like a car) too.
    expect(
      fitsInView(new Box3(new Vector3(-1, -0.8, -2.5), new Vector3(1, 1.2, 2.5)), 35, aspect),
    ).toBe(true);
  });

  it('backs off further on narrow viewports', () => {
    const wide = computeFraming(unitBox(), { fov: 35, aspect: 2 });
    const narrow = computeFraming(unitBox(), { fov: 35, aspect: 0.5 });
    const dist = (f: typeof wide) =>
      new Vector3().fromArray(f.position).distanceTo(new Vector3().fromArray(f.target));
    expect(dist(narrow)).toBeGreaterThan(dist(wide));
  });

  it('looks from the requested elevation', () => {
    const f = computeFraming(unitBox(), { fov: 35, aspect: 1, elevation: 30, azimuth: 0 });
    const dir = new Vector3()
      .fromArray(f.position)
      .sub(new Vector3().fromArray(f.target))
      .normalize();
    expect(MathUtils.radToDeg(Math.asin(dir.y))).toBeCloseTo(30);
    expect(dir.x).toBeCloseTo(0);
  });

  it('sets sane zoom limits and clip planes', () => {
    const f = computeFraming(unitBox(), { fov: 35, aspect: 1 });
    const distance = new Vector3().fromArray(f.position).length();
    expect(f.minDistance).toBeGreaterThan(f.radius);
    expect(f.minDistance).toBeLessThan(distance);
    expect(f.maxDistance).toBeGreaterThan(distance);
    expect(f.near).toBeLessThan(distance - f.radius);
    expect(f.far).toBeGreaterThan(distance + f.radius);
  });

  it('scales with model size (mm-sized vs building-sized)', () => {
    const tiny = computeFraming(
      new Box3(new Vector3(-0.001, -0.001, -0.001), new Vector3(0.001, 0.001, 0.001)),
      { fov: 35, aspect: 1 },
    );
    const huge = computeFraming(
      new Box3(new Vector3(-500, -500, -500), new Vector3(500, 500, 500)),
      { fov: 35, aspect: 1 },
    );
    expect(huge.minDistance / tiny.minDistance).toBeCloseTo(500_000, -3);
  });

  it('falls back to a unit sphere for an empty box', () => {
    const f = computeFraming(new Box3(), { fov: 35, aspect: 1 });
    expect(f.target).toEqual([0, 0, 0]);
    expect(f.radius).toBe(1);
  });

  it.each([
    ['tiny', 0.01],
    ['chair-sized', 0.9],
    ['car-sized', 2.7],
    ['building-sized', 40],
  ])('limits zoom on a %s model relative to its framing', (_, r) => {
    const box = new Box3(new Vector3(-r, -r, -r), new Vector3(r, r, r));
    const f = computeFraming(box, { fov: 35, aspect: 1.6 });
    const distance = new Vector3()
      .fromArray(f.position)
      .distanceTo(new Vector3().fromArray(f.target));
    expect(f.minDistance).toBeGreaterThan(f.radius * 1.2); // never inside the model
    expect(f.minDistance).toBeCloseTo(Math.max(f.radius * 1.25, distance * MIN_ZOOM_FACTOR));
    expect(f.maxDistance).toBeCloseTo(distance * MAX_ZOOM_FACTOR);
    expect(f.maxDistance / f.minDistance).toBeLessThan(4);
  });
});
