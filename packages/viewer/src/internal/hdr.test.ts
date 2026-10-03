import { describe, expect, it } from 'vitest';

import { keyIntensityFor, raiseToMinElevation } from './hdr';

describe('keyIntensityFor', () => {
  it('is faint for diffuse light and strong for a dominant sun', () => {
    expect(keyIntensityFor(1)).toBeCloseTo(0.25);
    expect(keyIntensityFor(40)).toBeCloseTo(2.5);
  });

  it('increases with dominance', () => {
    expect(keyIntensityFor(10)).toBeGreaterThan(keyIntensityFor(5));
  });
});

describe('raiseToMinElevation', () => {
  const elevationDeg = (v: number[]) => (Math.asin(v[1] ?? 0) * 180) / Math.PI;
  const azimuth = (v: number[]) => Math.atan2(v[2] ?? 0, v[0] ?? 0);

  it('raises a low light to the minimum, keeping its compass direction', () => {
    const low: [number, number, number] = [0.8, 0.1, 0.59];
    const raised = raiseToMinElevation(low, 35);
    expect(elevationDeg(raised)).toBeCloseTo(35);
    expect(azimuth(raised)).toBeCloseTo(azimuth(low));
    expect(Math.hypot(...raised)).toBeCloseTo(1);
  });

  it('leaves a high light alone (normalized)', () => {
    const high = raiseToMinElevation([0, 2, 0.5], 35);
    expect(elevationDeg(high)).toBeGreaterThan(70);
    expect(Math.hypot(...high)).toBeCloseTo(1);
  });
});
