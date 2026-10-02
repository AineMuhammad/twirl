import { describe, expect, it } from 'vitest';

import { keyIntensityFor } from './hdr';

describe('keyIntensityFor', () => {
  it('is faint for diffuse light and strong for a dominant sun', () => {
    expect(keyIntensityFor(1)).toBeCloseTo(0.25);
    expect(keyIntensityFor(40)).toBeCloseTo(2.5);
  });

  it('increases with dominance', () => {
    expect(keyIntensityFor(10)).toBeGreaterThan(keyIntensityFor(5));
  });
});
