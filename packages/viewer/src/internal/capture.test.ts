import { describe, expect, it } from 'vitest';

import { capturePixelRatio } from './capture';

describe('capturePixelRatio', () => {
  it('doubles the resolution but keeps the longest side within the cap', () => {
    expect(capturePixelRatio(1, { width: 800, height: 600 })).toBe(2);
    expect(capturePixelRatio(2, { width: 800, height: 600 })).toBe(3000 / 800);
    expect(capturePixelRatio(3, { width: 400, height: 800 }, 2, 2000)).toBe(2.5);
    // Low-DPR screens still capture at least at 2×.
    expect(capturePixelRatio(0.75, { width: 500, height: 400 })).toBe(2);
  });
});
