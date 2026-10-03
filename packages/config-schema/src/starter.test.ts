import { describe, expect, it } from 'vitest';

import { productConfigSchema } from './config';
import { humanizeName, slugify } from './names';
import { type StarterMeshNode, starterConfig } from './starter';

const mesh = (id: string, name: string): StarterMeshNode => ({
  id,
  name,
  hasName: name !== '',
  kind: 'mesh',
  children: [],
});

const tree: StarterMeshNode[] = [
  mesh('0', 'Body_Exterior_Mesh'),
  {
    id: '1',
    name: 'Wheels',
    hasName: true,
    kind: 'group',
    children: [mesh('1/0', 'Tire'), mesh('1/1', 'Tire'), mesh('1/2', '')],
  },
  mesh('2', 'Body Exterior'), // slug collides with the first
];

describe('starterConfig', () => {
  const config = starterConfig({ name: '  My product ', meshTree: tree });

  it('produces a valid config', () => {
    expect(productConfigSchema.safeParse(config).success).toBe(true);
    expect(config.product.name).toBe('My product');
    expect(config.pricing).toEqual({ currency: 'USD', base: 0 });
  });

  it('makes one part per distinct mesh name, unnamed meshes by path, with unique ids', () => {
    expect(config.parts).toEqual([
      { id: 'body-exterior', label: 'Body Exterior', meshes: ['Body_Exterior_Mesh'] },
      { id: 'tire', label: 'Tire', meshes: ['Tire'] },
      { id: 'part-4', label: 'Part 4', meshes: ['#1/2'] },
      { id: 'body-exterior-2', label: 'Body Exterior', meshes: ['Body Exterior'] },
    ]);
  });

  it('gives every part a colour group (with custom) and a show/hide group', () => {
    expect(config.groups).toHaveLength(config.parts.length * 2);
    const color = config.groups.find((g) => g.id === 'tire-color');
    expect(color?.type === 'color' && color.allowCustom).toBe(true);
    expect(config.groups.find((g) => g.id === 'tire-visible')?.type).toBe('visibility');
  });

  it('handles an empty model', () => {
    const empty = starterConfig({ name: '', meshTree: [] });
    expect(empty.parts).toEqual([]);
    expect(empty.product.name).toBe('Untitled product');
  });
});

describe('humanizeName', () => {
  it.each([
    ['Pillow_01', 'Pillow 01'],
    ['iron', 'Iron'],
    ['Black_Gloss_Trim_Mesh', 'Black Gloss Trim'],
    ['seatCushionLeft', 'Seat Cushion Left'],
    ['leg.002', 'Leg 002'],
    ['___', '___'],
  ])('%s → %s', (input, expected) => {
    expect(humanizeName(input)).toBe(expected);
  });
});

describe('slugify', () => {
  it('makes config ids from text', () => {
    expect(slugify('Black Gloss Trim')).toBe('black-gloss-trim');
    expect(slugify('Fauteuil – Crème')).toBe('fauteuil-creme');
    expect(slugify('***')).toBe('');
    expect(slugify('x'.repeat(100))).toHaveLength(48);
  });
});

describe('starterConfig without options', () => {
  it('creates parts only', () => {
    const config = starterConfig({
      name: 'Chair',
      meshTree: [{ id: '0', name: 'Seat', hasName: true, kind: 'mesh', children: [] }],
      withOptions: false,
    });
    expect(config.parts).toHaveLength(1);
    expect(config.groups).toEqual([]);
  });
});
