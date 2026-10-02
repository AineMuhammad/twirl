import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import { easeOutCubic, INTRO_DISTANCE_SCALE, introPosition } from './intro';

const target = [0, 0.5, 0] as const;
const final = [3, 1.5, 4] as const;
const dist = (p: readonly number[]) => new Vector3(...p).distanceTo(new Vector3(...target));

describe('easeOutCubic', () => {
  it('runs 0 → 1, fast then slow, and clamps', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
    expect(easeOutCubic(2)).toBe(1);
    expect(easeOutCubic(-1)).toBe(0);
  });
});

describe('introPosition', () => {
  it('starts further out and ends exactly at the framed position', () => {
    expect(dist(introPosition(target, final, 0))).toBeCloseTo(dist(final) * INTRO_DISTANCE_SCALE);
    introPosition(target, final, 1).forEach((v, i) => expect(v).toBeCloseTo(final[i] ?? NaN));
  });

  it('keeps the same height angle and moves monotonically closer', () => {
    let previous = Infinity;
    for (let t = 0; t <= 1; t += 0.1) {
      const d = dist(introPosition(target, final, t));
      expect(d).toBeLessThanOrEqual(previous + 1e-9);
      previous = d;
    }
  });
});
