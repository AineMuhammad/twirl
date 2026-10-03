import { DataUtils } from 'three';
import { describe, expect, it } from 'vitest';

import { equirectDirection, equirectUv, estimateSun } from './sun';

const W = 256;
const H = 128;

/** Uniform grey panorama with an optional bright disc around (u, v). */
function panorama({ sun, half = false }: { sun?: [number, number]; half?: boolean }) {
  const data = half ? new Uint16Array(W * H * 4) : new Float32Array(W * H * 4);
  for (let row = 0; row < H; row++) {
    for (let col = 0; col < W; col++) {
      const u = (col + 0.5) / W;
      const v = 1 - (row + 0.5) / H;
      let value = 0.5;
      if (sun && Math.hypot((u - sun[0]) * 2, v - sun[1]) < 0.04) value = 50;
      const i = (row * W + col) * 4;
      for (let k = 0; k < 3; k++) data[i + k] = half ? DataUtils.toHalfFloat(value) : value;
      data[i + 3] = half ? DataUtils.toHalfFloat(1) : 1;
    }
  }
  return { width: W, height: H, data, halfFloat: half };
}

const angleBetween = (a: number[], b: number[]) =>
  (Math.acos(
    Math.min(
      1,
      a.reduce((s, x, i) => s + x * (b[i] ?? 0), 0),
    ),
  ) *
    180) /
  Math.PI;

describe('equirect mapping', () => {
  it('round-trips with the three.js shader formula', () => {
    for (const [u, v] of [
      [0.1, 0.8],
      [0.5, 0.5],
      [0.9, 0.3],
      [0.25, 0.95],
    ] as const) {
      const [u2, v2] = equirectUv(equirectDirection(u, v));
      expect(u2).toBeCloseTo(u, 6);
      expect(v2).toBeCloseTo(v, 6);
    }
  });

  it('puts the top of the panorama straight up', () => {
    expect(equirectDirection(0.3, 1)[1]).toBeCloseTo(1);
  });
});

describe('estimateSun', () => {
  it('finds a sun in the sky (float data)', () => {
    const sun: [number, number] = [0.3, 0.8];
    const est = estimateSun(panorama({ sun }));
    expect(angleBetween(est.direction, equirectDirection(...sun))).toBeLessThan(6);
    expect(est.dominance).toBeGreaterThan(10);
  });

  it('reads half-float data (HDRLoader default)', () => {
    const sun: [number, number] = [0.7, 0.65];
    const est = estimateSun(panorama({ sun, half: true }));
    expect(angleBetween(est.direction, equirectDirection(...sun))).toBeLessThan(6);
  });

  it('ignores bright spots below the horizon (shadows must fall down)', () => {
    const est = estimateSun(panorama({ sun: [0.5, 0.2] }));
    expect(est.direction[1]).toBeGreaterThan(0);
  });

  it('reports low dominance for flat, overcast light', () => {
    expect(estimateSun(panorama({})).dominance).toBeCloseTo(1, 1);
  });
});
