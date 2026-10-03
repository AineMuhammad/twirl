import { Color } from 'three';
import { describe, expect, it } from 'vitest';

import { floorColorFor } from './floor-color';

const lightness = (hex: string) => {
  const hsl = { h: 0, s: 0, l: 0 };
  new Color(hex).getHSL(hsl);
  return hsl.l;
};

describe('floorColorFor', () => {
  it('darkens light backgrounds slightly', () => {
    const floor = floorColorFor({ type: 'solid', color: '#f5f5f5' });
    expect(lightness(floor)).toBeLessThan(lightness('#f5f5f5'));
    expect(lightness(floor)).toBeGreaterThan(0.85);
  });

  it('lightens very dark backgrounds so the floor stays visible', () => {
    expect(lightness(floorColorFor({ type: 'solid', color: '#050505' }))).toBeGreaterThan(
      lightness('#050505'),
    );
  });

  it('uses the bottom color of a gradient', () => {
    const fromBottom = floorColorFor({ type: 'gradient', from: '#ffffff', to: '#202040' });
    expect(fromBottom).toBe(floorColorFor({ type: 'solid', color: '#202040' }));
  });

  it('returns a hex color', () => {
    expect(floorColorFor({ type: 'solid', color: '#abcdef' })).toMatch(/^#[0-9a-f]{6}$/);
  });
});
