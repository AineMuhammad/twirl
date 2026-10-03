import { Box3, MathUtils, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import { computeFraming } from './framing';
import { CAMERA_VIEWS, glidePosition, viewPosition } from './views';

const framing = computeFraming(new Box3(new Vector3(-1, 0, -1), new Vector3(1, 2, 1)), {
  fov: 35,
  aspect: 1.5,
});
const target = new Vector3(...framing.target);
const framedDistance = new Vector3(...framing.position).distanceTo(target);
const dir = (p: readonly number[]) => new Vector3(...p).sub(target).normalize();

describe('viewPosition', () => {
  it.each(CAMERA_VIEWS)('%s keeps the framing distance', (view) => {
    expect(new Vector3(...viewPosition(framing, view)).distanceTo(target)).toBeCloseTo(
      framedDistance,
    );
  });

  it('front looks from +Z, side from +X, back from -Z, top from above', () => {
    expect(dir(viewPosition(framing, 'front')).z).toBeGreaterThan(0.9);
    expect(dir(viewPosition(framing, 'side')).x).toBeGreaterThan(0.9);
    expect(dir(viewPosition(framing, 'back')).z).toBeLessThan(-0.9);
    expect(MathUtils.radToDeg(Math.asin(dir(viewPosition(framing, 'top')).y))).toBeCloseTo(72);
  });
});

describe('glidePosition', () => {
  const t3 = framing.target;
  it('starts and ends at the given positions', () => {
    const from = viewPosition(framing, 'front');
    const to = viewPosition(framing, 'side');
    glidePosition(t3, from, to, 0).forEach((v, i) => expect(v).toBeCloseTo(from[i] ?? NaN));
    glidePosition(t3, from, to, 1).forEach((v, i) => expect(v).toBeCloseTo(to[i] ?? NaN));
  });

  it('takes the shorter way round (350° → 10° passes through 0°, not 180°)', () => {
    const at = (deg: number) => {
      const r = MathUtils.degToRad(deg);
      return [Math.sin(r) * 5, 1, Math.cos(r) * 5] as const;
    };
    const mid = glidePosition([0, 1, 0], at(350), at(10), 0.5);
    expect(mid[2]).toBeGreaterThan(4.5); // near the front (+Z), not the back
  });
});
