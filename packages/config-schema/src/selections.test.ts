import { describe, expect, it } from 'vitest';

import { type DimensionGroup, productConfigSchema } from './config';
import { jeepConfig, loungeChairConfig } from './samples';
import { defaultSelections, resolveSelections, snapDimension } from './selections';

const chair = productConfigSchema.parse(loungeChairConfig);
const jeep = productConfigSchema.parse(jeepConfig);
const diameter = chair.groups.find((g) => g.id === 'diameter') as DimensionGroup;

describe('defaultSelections', () => {
  it('uses each group default, with "original" for colour groups without one', () => {
    expect(defaultSelections(chair)).toEqual({
      fabric: 'original',
      'frame-finish': 'original',
      'pillow-diamond': true,
      'pillow-navy': true,
      diameter: 120,
    });
    expect(defaultSelections(jeep)['roof-rails']).toBe(false);
  });
});

describe('resolveSelections', () => {
  it('keeps valid selections untouched', () => {
    const input = {
      fabric: 'sage',
      'frame-finish': 'brass',
      'pillow-diamond': false,
      'pillow-navy': true,
      diameter: 135,
    };
    expect(resolveSelections(chair, input)).toEqual({ selections: input, adjustments: [] });
  });

  it('fills missing groups with defaults without reporting them', () => {
    const { selections, adjustments } = resolveSelections(chair, { fabric: 'charcoal' });
    expect(selections).toEqual({ ...defaultSelections(chair), fabric: 'charcoal' });
    expect(adjustments).toEqual([]);
  });

  it('treats non-object input as empty', () => {
    for (const input of [null, 'x', 42, ['a']]) {
      expect(resolveSelections(chair, input).selections).toEqual(defaultSelections(chair));
    }
  });

  it('drops unknown groups (e.g. from an older version)', () => {
    const { selections, adjustments } = resolveSelections(chair, { legs: 'hairpin' });
    expect(selections).not.toHaveProperty('legs');
    expect(adjustments).toEqual([{ group: 'legs', reason: 'unknown-group' }]);
  });

  it('replaces removed swatches and wrong types with defaults', () => {
    const { selections, adjustments } = resolveSelections(chair, {
      fabric: 'mustard',
      'pillow-navy': 'yes',
      diameter: 'big',
    });
    expect(selections).toMatchObject({ fabric: 'original', 'pillow-navy': true, diameter: 120 });
    expect(adjustments.map((a) => `${a.group}:${a.reason}`)).toEqual([
      'fabric:invalid-value',
      'pillow-navy:invalid-value',
      'diameter:invalid-value',
    ]);
  });

  it('accepts custom colours only where allowed, normalising the hex', () => {
    expect(resolveSelections(chair, { fabric: { custom: '#AABBCC' } }).selections.fabric).toEqual({
      custom: '#aabbcc',
    });
    const frame = resolveSelections(chair, { 'frame-finish': { custom: '#aabbcc' } });
    expect(frame.selections['frame-finish']).toBe('original');
    expect(frame.adjustments).toEqual([{ group: 'frame-finish', reason: 'custom-not-allowed' }]);
  });

  it('clamps and snaps dimensions, reporting both', () => {
    const { selections, adjustments } = resolveSelections(chair, { diameter: 123 });
    expect(selections.diameter).toBe(125);
    expect(adjustments).toEqual([{ group: 'diameter', reason: 'off-step', from: 123, to: 125 }]);
    expect(resolveSelections(chair, { diameter: 400 }).adjustments).toEqual([
      { group: 'diameter', reason: 'out-of-range', from: 400, to: 140 },
    ]);
    expect(resolveSelections(chair, { diameter: Number.NaN }).selections.diameter).toBe(120);
  });
});

describe('snapDimension', () => {
  it('snaps to the nearest step from min and clamps', () => {
    expect(snapDimension(diameter, 102.4)).toBe(100);
    expect(snapDimension(diameter, 102.6)).toBe(105);
    expect(snapDimension(diameter, 50)).toBe(100);
    expect(snapDimension(diameter, 999)).toBe(140);
  });

  it('avoids floating-point noise with fractional steps', () => {
    const fine = { ...diameter, min: 0, max: 1, step: 0.1, default: 0.5 };
    expect(snapDimension(fine, 0.30000000000000004)).toBe(0.3);
  });
});
