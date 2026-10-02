import { describe, expect, it } from 'vitest';

import { qualitySettings } from './quality';

describe('qualitySettings', () => {
  it('uses the full pixel ratio and best shadows at full quality', () => {
    expect(qualitySettings(1, false, 2)).toEqual({ dpr: 2, shadowMapSize: 2048 });
  });

  it('drops to 1x and smaller shadows at the lowest quality', () => {
    expect(qualitySettings(0, false, 2)).toEqual({ dpr: 1, shadowMapSize: 1024 });
  });

  it('starts phones one shadow step lower', () => {
    expect(qualitySettings(1, true, 1.5).shadowMapSize).toBe(1024);
    expect(qualitySettings(0, true, 1.5)).toEqual({ dpr: 1, shadowMapSize: 512 });
  });

  it('clamps out-of-range factors', () => {
    expect(qualitySettings(5, false, 2).dpr).toBe(2);
    expect(qualitySettings(-1, false, 2).dpr).toBe(1);
  });
});
