import { describe, expect, it } from 'vitest';

import { type ProductConfigInput, productConfigSchema } from './config';
import { jeepConfig, loungeChairConfig } from './samples';

/** A deep copy we can break safely. */
const chair = (): ProductConfigInput => structuredClone(loungeChairConfig) as ProductConfigInput;

function issues(input: unknown) {
  const result = productConfigSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
}

describe('productConfigSchema: samples', () => {
  it.each([
    ['lounge chair', loungeChairConfig],
    ['jeep', jeepConfig],
  ])('accepts the %s sample', (_, config) => {
    expect(issues(config)).toEqual([]);
  });

  it('fills defaults and normalises colours', () => {
    const input = chair();
    const fabric = input.groups[0];
    if (fabric?.type !== 'color') throw new Error('fixture');
    (fabric.swatches ??= [])[0] = { id: 'oat-linen', label: 'Oat linen', color: '#D8CCB6' };
    delete input.rules;
    delete input.presentation;
    const config = productConfigSchema.parse(input);
    expect(config.rules).toEqual([]);
    expect(config.presentation).toEqual({
      layout: 'sidebar',
      theme: { accent: '#4f46e5', font: 'geist' },
      camera: { initialView: 'threeQuarter', frontAzimuth: 0 },
    });
    const parsedFabric = config.groups[0];
    if (parsedFabric?.type !== 'color') throw new Error('fixture');
    expect(parsedFabric.swatches[0]).toEqual({
      id: 'oat-linen',
      label: 'Oat linen',
      color: '#d8ccb6',
      price: 0,
    });
  });
});

describe('productConfigSchema: cross-references', () => {
  it('rejects duplicate part and group ids', () => {
    const input = chair();
    input.parts.push({ id: 'frame', label: 'Again', meshes: ['x'] });
    expect(issues(input)).toContainEqual(expect.stringContaining('Duplicate part id "frame"'));
  });

  it('rejects groups that reference unknown parts', () => {
    const input = chair();
    const g = input.groups[2];
    if (g?.type !== 'visibility') throw new Error('fixture');
    g.parts = ['legs'];
    expect(issues(input)).toContainEqual(expect.stringContaining('Unknown part "legs"'));
  });

  it('rejects a part coloured by two groups', () => {
    const input = chair();
    input.groups.push({
      type: 'color',
      id: 'seat-again',
      label: 'Again',
      parts: ['seat'],
      default: null,
      swatches: [{ id: 'a', label: 'A', color: '#000000' }],
    });
    expect(issues(input)).toContainEqual(expect.stringContaining('already coloured by "fabric"'));
  });

  it('rejects a colour default that is not a swatch, and reserved swatch ids', () => {
    const input = chair();
    const g = input.groups[1];
    if (g?.type !== 'color') throw new Error('fixture');
    g.default = 'gold';
    (g.swatches ??= []).push({ id: 'custom', label: 'Nope', color: '#000000' });
    const found = issues(input);
    expect(found).toContainEqual(expect.stringContaining('Default "gold"'));
    expect(found).toContainEqual(expect.stringContaining('"custom" is reserved'));
  });

  it('checks dimension bounds and steps', () => {
    const input = chair();
    const d = input.groups[4];
    if (d?.type !== 'dimension') throw new Error('fixture');
    d.default = 122; // off-step
    d.max = 142; // not a whole number of steps
    const found = issues(input);
    expect(found).toContainEqual(expect.stringContaining('default must land on a step'));
    expect(found).toContainEqual(expect.stringContaining('whole number of steps'));

    d.min = 150;
    expect(issues(input)).toContainEqual(expect.stringContaining('max must be greater than min'));
  });

  it('checks rule references and comparator types', () => {
    const input = chair();
    input.rules = [
      {
        type: 'requires',
        id: 'r1',
        when: { group: 'nope', equals: 'x' },
        require: { group: 'frame-finish', equals: 'gold' },
        message: 'm',
      },
      {
        type: 'excludes',
        id: 'r2',
        a: { group: 'diameter', equals: 'brass' },
        b: { group: 'fabric', min: 3 },
        message: 'm',
      },
    ];
    const found = issues(input);
    expect(found).toContainEqual(expect.stringContaining('Unknown group "nope"'));
    expect(found).toContainEqual(expect.stringContaining('"gold" isn\'t an option'));
    expect(found).toContainEqual(expect.stringContaining('"diameter" isn\'t a colour group'));
    expect(found).toContainEqual(expect.stringContaining('"fabric" isn\'t a dimension'));
  });

  it('allows "original" and "custom" in colour conditions', () => {
    const input = chair();
    input.rules = [
      {
        type: 'excludes',
        id: 'r',
        a: { group: 'fabric', oneOf: ['original', 'custom'] },
        b: { group: 'frame-finish', equals: 'bone' },
        message: 'm',
      },
    ];
    expect(issues(input)).toEqual([]);
  });

  it('requires exactly one comparator in a condition', () => {
    const input = chair();
    input.rules = [
      {
        type: 'excludes',
        id: 'r',
        // Two comparators on purpose: allowed by the type, rejected by the schema.
        a: { group: 'fabric', equals: 'sage', oneOf: ['sage'] },
        b: { group: 'pillow-navy', equals: true },
        message: 'm',
      },
    ];
    expect(issues(input)).toContainEqual(expect.stringContaining('exactly one of'));
  });

  it('accepts nested all/any/not conditions', () => {
    const input = chair();
    input.rules = [
      {
        type: 'availability',
        id: 'r',
        when: {
          all: [
            {
              any: [
                { group: 'fabric', equals: 'sage' },
                { group: 'diameter', max: 110 },
              ],
            },
            { not: { group: 'pillow-diamond', equals: true } },
          ],
        },
        target: { group: 'frame-finish', options: ['rust'] },
        effect: 'hide',
        message: 'm',
      },
    ];
    expect(issues(input)).toEqual([]);
  });

  it('rejects malformed ids, colours and money', () => {
    const input = chair();
    input.parts[0] = { id: 'Frame Part', label: 'Frame', meshes: ['iron'] };
    const g = input.groups[0];
    if (g?.type !== 'color') throw new Error('fixture');
    (g.swatches ??= [])[0] = { id: 'x', label: 'X', color: 'red', price: 1.5 };
    const found = issues(input).join('\n');
    expect(found).toMatch(/lowercase letters/);
    expect(found).toMatch(/hex colour/);
    expect(found).toMatch(/whole minor units/);
  });
});

describe('hidden meshes and empty colour lists', () => {
  it('accepts colour options with only the original finish, and hidden meshes outside parts', () => {
    const parsed = productConfigSchema.safeParse({
      schemaVersion: 1,
      product: { name: 'Chair' },
      parts: [{ id: 'seat', label: 'Seat', meshes: ['Seat'] }],
      hiddenMeshes: ['Floor_Prop'],
      groups: [
        { type: 'color', id: 'seat-color', label: 'Seat colour', parts: ['seat'], default: null },
      ],
      pricing: { currency: 'USD', base: 0 },
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.groups[0]).toMatchObject({ swatches: [] });
  });

  it('rejects a hidden mesh that is also in a part', () => {
    const parsed = productConfigSchema.safeParse({
      schemaVersion: 1,
      product: { name: 'Chair' },
      parts: [{ id: 'seat', label: 'Seat', meshes: ['Seat'] }],
      hiddenMeshes: ['Seat'],
      groups: [],
      pricing: { currency: 'USD', base: 0 },
    });
    expect(parsed.success).toBe(false);
  });
});
