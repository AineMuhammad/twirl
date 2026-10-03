import { parseProductConfig, type ProductConfig } from '@twirl/config-schema';
import { describe, expect, it } from 'vitest';

import type { MeshTreeNode } from '../types';
import {
  deformationsForSelections,
  nodeIdsByMesh,
  overridesForSelections,
} from './config-overrides';

const node = (id: string, name: string, children: MeshTreeNode[] = [], hasName = true) =>
  ({
    id,
    name,
    hasName,
    kind: children.length ? 'group' : 'mesh',
    triangleCount: 1,
    materialNames: [],
    children,
  }) satisfies MeshTreeNode;

const tree = [
  node('0', 'Frame', [node('0/0', 'Leg'), node('0/1', 'Leg')]),
  node('1', 'Unnamed mesh 2', [], false),
];

function config(): ProductConfig {
  const parsed = parseProductConfig({
    schemaVersion: 1,
    product: { name: 'Chair' },
    parts: [
      { id: 'legs', label: 'Legs', meshes: ['Leg'] },
      { id: 'cushion', label: 'Cushion', meshes: ['#1'] },
    ],
    groups: [
      {
        type: 'color',
        id: 'legs-color',
        label: 'Legs',
        parts: ['legs'],
        swatches: [{ id: 'oak', label: 'Oak', color: '#aa7744' }],
        default: null,
        allowCustom: true,
      },
      { type: 'visibility', id: 'cushion', label: 'Cushion', parts: ['cushion'], default: true },
    ],
    pricing: { currency: 'USD', base: 1000 },
  });
  if (!parsed.success) throw parsed.error;
  return parsed.data;
}

describe('nodeIdsByMesh', () => {
  it('matches named nodes by name and every node by #path', () => {
    const map = nodeIdsByMesh(tree);
    expect(map.get('Leg')).toEqual(['0/0', '0/1']);
    expect(map.get('#1')).toEqual(['1']);
    expect(map.has('Unnamed mesh 2')).toBe(false);
  });
});

describe('overridesForSelections', () => {
  it('paints swatches and custom colours, and hides hidden groups', () => {
    const c = config();
    expect(overridesForSelections(c, { 'legs-color': 'oak', cushion: false }, tree)).toEqual({
      '0/0': { color: '#aa7744' },
      '0/1': { color: '#aa7744' },
      '1': { visible: false },
    });
    expect(
      overridesForSelections(c, { 'legs-color': { custom: '#112233' }, cushion: true }, tree),
    ).toEqual({ '0/0': { color: '#112233' }, '0/1': { color: '#112233' } });
  });

  it('leaves the original finish untouched', () => {
    expect(
      overridesForSelections(config(), { 'legs-color': 'original', cushion: true }, tree),
    ).toEqual({});
  });
});

describe('deformationsForSelections', () => {
  it('scales the chosen axes by value / nativeSize for each behaviour', async () => {
    const { loungeChairConfig } = await import('@twirl/config-schema/samples');
    const parsed = parseProductConfig(loungeChairConfig);
    if (!parsed.success) throw parsed.error;
    const chairTree = ['iron', 'Chair', 'Pillow_01', 'Pillow_02'].map((n, i) => node(`${i}`, n));
    const result = deformationsForSelections(parsed.data, { diameter: 132 }, chairTree);
    expect(result).toEqual([
      { nodeIds: ['0'], mode: 'stretch', scale: [1.1, 1, 1.1] },
      { nodeIds: ['1'], mode: 'stretch', scale: [1.1, 1, 1.1] },
      { nodeIds: ['2'], mode: 'anchor', scale: [1.1, 1, 1.1] },
      { nodeIds: ['3'], mode: 'anchor', scale: [1.1, 1, 1.1] },
    ]);
  });
});
