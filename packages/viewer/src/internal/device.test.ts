import { describe, expect, it } from 'vitest';

import { DPR_CAP_COARSE, DPR_CAP_FINE, dprRange, readDeviceHints } from './device';

describe('dprRange', () => {
  it('caps touch devices lower than desktop', () => {
    expect(dprRange({ coarsePointer: true, devicePixelRatio: 3 })).toEqual([1, DPR_CAP_COARSE]);
    expect(dprRange({ coarsePointer: false, devicePixelRatio: 3 })).toEqual([1, DPR_CAP_FINE]);
  });

  it('never exceeds the device ratio', () => {
    expect(dprRange({ coarsePointer: false, devicePixelRatio: 1.25 })).toEqual([1, 1.25]);
  });

  it('never goes below 1', () => {
    expect(dprRange({ coarsePointer: false, devicePixelRatio: 0.5 })).toEqual([1, 1]);
  });
});

describe('readDeviceHints', () => {
  it('falls back safely without a window (SSR)', () => {
    expect(readDeviceHints(undefined)).toEqual({ coarsePointer: false, devicePixelRatio: 1 });
  });

  it('reads pointer type and pixel ratio', () => {
    const win = {
      matchMedia: (q: string) => ({ matches: q === '(pointer: coarse)' }) as MediaQueryList,
      devicePixelRatio: 3,
    };
    expect(readDeviceHints(win)).toEqual({ coarsePointer: true, devicePixelRatio: 3 });
  });
});
