import { describe, expect, it } from 'vitest';

import { cycloramaColor, cycloramaProfile, cycloramaSize } from './cyclorama';

describe('cycloramaProfile', () => {
  const size = cycloramaSize(1);
  const profile = cycloramaProfile(size, 8);

  it('starts flat at the centre and ends at the top of the wall', () => {
    expect(profile[0]).toEqual([0, 0]);
    expect(profile[1]).toEqual([size.floor, 0]);
    const last = profile.at(-1);
    expect(last?.[0]).toBeCloseTo(size.floor + size.cove);
    expect(last?.[1]).toBeCloseTo(size.cove + size.wall);
  });

  it('only moves outward and upward (a smooth cove, no folds)', () => {
    profile.slice(1).forEach(([x, y], i) => {
      const [px, py] = profile[i] ?? [0, 0];
      expect(x).toBeGreaterThanOrEqual(px - 1e-9);
      expect(y).toBeGreaterThanOrEqual(py - 1e-9);
    });
  });

  it('keeps the camera inside: bowl radius exceeds the max zoom distance (~6.4× radius)', () => {
    expect(size.floor + size.cove).toBeGreaterThan(6.4 * 1.2);
  });
});

describe('cycloramaColor', () => {
  it('paints mostly the light centre tone of a radial backdrop', () => {
    expect(cycloramaColor({ type: 'radial', inner: '#ffffff', outer: '#000000' })).toMatch(
      /^#[0-9a-f]{6}$/,
    );
    expect(cycloramaColor({ type: 'solid', color: '#123456' })).toBe('#123456');
  });
});
