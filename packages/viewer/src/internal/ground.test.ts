import { describe, expect, it } from 'vitest';

import { groundProjection } from './ground';

describe('groundProjection', () => {
  it('uses a standing camera height for furniture-sized models', () => {
    const g = groundProjection({ center: [0, 0.5, 0], radius: 0.9, floorY: 0 });
    expect(g.height).toBeCloseTo(1.7);
    // Ground plane (y - height) lands at the model's base, just below the shadow catcher.
    expect(g.y - g.height).toBeCloseTo(0, 2);
    expect(g.y - g.height).toBeLessThan(-0.9 * 0.002);
  });

  it('raises the camera for very large models', () => {
    expect(groundProjection({ center: [0, 0, 0], radius: 20, floorY: -3 }).height).toBe(16);
  });

  it('keeps the dome far outside the zoom range', () => {
    expect(
      groundProjection({ center: [0, 0, 0], radius: 5, floorY: 0 }).radius,
    ).toBeGreaterThanOrEqual(5 * 12);
  });
});
