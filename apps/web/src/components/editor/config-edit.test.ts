import { parseProductConfig, type ProductConfig } from '@twirl/config-schema';
import { loungeChairConfig } from '@twirl/config-schema/samples';
import type { MeshTreeNode } from '@twirl/viewer';
import { describe, expect, it } from 'vitest';

import {
  addColorGroup,
  addDimensionGroup,
  addRule,
  colorOptions,
  defaultCondition,
  removeRule,
  addPart,
  addSwatch,
  addVisibilityGroup,
  assignMesh,
  coloredParts,
  meshChoices,
  moneyInput,
  moveGroup,
  parseMoney,
  removeGroup,
  removePart,
  removeSwatch,
  uniqueId,
  unassignMesh,
} from './config-edit';

function chair(): ProductConfig {
  const parsed = parseProductConfig(loungeChairConfig);
  if (!parsed.success) throw parsed.error;
  return parsed.data;
}

const valid = (config: ProductConfig) => parseProductConfig(config).success;

const node = (id: string, name: string, hasName = true, children: MeshTreeNode[] = []) =>
  ({
    id,
    name,
    hasName,
    kind: children.length ? 'group' : 'mesh',
    triangleCount: 1,
    materialNames: [],
    children,
  }) satisfies MeshTreeNode;

describe('ids and meshes', () => {
  it('makes unique slug ids', () => {
    expect(uniqueId('Seat Cushion', [], 'part')).toBe('seat-cushion');
    expect(uniqueId('Seat', ['seat', 'seat-2'], 'part')).toBe('seat-3');
    expect(uniqueId('???', [], 'part')).toBe('part');
  });

  it('lists meshes once per reference, unnamed ones by path', () => {
    const tree = [
      node('0', 'Body', true, [node('0/0', 'Leg'), node('0/1', 'Leg')]),
      node('1', 'Mesh 2', false),
    ];
    expect(meshChoices(tree).map((m) => m.ref)).toEqual(['Leg', '#1']);
  });
});

describe('parts', () => {
  it('adds a part, stealing its meshes from other parts', () => {
    const next = addPart(chair(), 'Legs', ['iron']);
    expect(next.parts.at(-1)).toMatchObject({ id: 'legs', meshes: ['iron'] });
    // "frame" lost its only mesh, so the config is invalid until it's fixed or removed.
    expect(next.parts.find((p) => p.id === 'frame')?.meshes).toEqual([]);
  });

  it('moves a mesh between parts and removes parts left empty', () => {
    const moved = assignMesh(chair(), 'seat', 'Pillow_01');
    expect(moved.parts.find((p) => p.id === 'seat')?.meshes).toEqual(['Chair', 'Pillow_01']);
    const unassigned = unassignMesh(chair(), 'Pillow_02');
    expect(unassigned.parts.some((p) => p.id === 'pillow-navy')).toBe(false);
    expect(unassigned.groups.some((g) => g.id === 'pillow-navy')).toBe(false);
    expect(valid(unassigned)).toBe(true);
  });

  it('removing a part drops emptied groups and the rules that mention them', () => {
    const next = removePart(chair(), 'frame');
    expect(next.groups.some((g) => g.id === 'frame-finish')).toBe(false);
    expect(next.rules.map((r) => r.id)).toEqual(['navy-with-dark-fabrics']);
    // The diameter group keeps its other behaviours.
    expect(next.groups.some((g) => g.id === 'diameter')).toBe(true);
    expect(valid(next)).toBe(true);
  });
});

describe('groups and swatches', () => {
  it('adds valid colour and visibility groups', () => {
    let next = removeGroup(chair(), 'frame-finish');
    expect(coloredParts(next).has('frame')).toBe(false);
    next = addColorGroup(next, 'Frame colour', ['frame']);
    next = addVisibilityGroup(next, 'Frame', ['frame']);
    expect(next.groups.slice(-2).map((g) => g.id)).toEqual(['frame-colour', 'frame']);
    expect(valid(next)).toBe(true);
  });

  it('reorders groups within bounds', () => {
    const ids = (c: ProductConfig) => c.groups.map((g) => g.id);
    const config = chair();
    expect(ids(moveGroup(config, 'frame-finish', -1)).slice(0, 2)).toEqual([
      'frame-finish',
      'fabric',
    ]);
    expect(moveGroup(config, 'fabric', -1)).toBe(config);
  });

  it('adds swatches with fresh ids and clears a removed default', () => {
    const fabric = chair().groups.find((g) => g.id === 'fabric');
    if (fabric?.type !== 'color') throw new Error('fabric');
    const added = addSwatch(fabric);
    expect(added.swatches.at(-1)?.id).toBe(`colour-${fabric.swatches.length + 1}`);
    const withDefault = { ...fabric, default: 'sage' };
    expect(removeSwatch(withDefault, 'sage').default).toBeNull();
  });
});

describe('money', () => {
  it('converts between input text and minor units', () => {
    expect(parseMoney('49.5')).toBe(4950);
    expect(parseMoney('1,299.99')).toBe(129999);
    expect(parseMoney('-10')).toBe(-1000);
    expect(parseMoney('abc')).toBeNull();
    expect(parseMoney('1.234')).toBeNull();
    expect(moneyInput(4950)).toBe('49.50');
  });
});

describe('sizes and rules', () => {
  it('adds a valid size option and valid rules of every type', () => {
    let config = addDimensionGroup(chair(), 'Width', ['seat']);
    expect(config.groups.at(-1)).toMatchObject({ id: 'width', type: 'dimension', axes: ['x'] });
    expect(valid(config)).toBe(true);
    for (const type of ['requires', 'excludes', 'availability'] as const) {
      config = addRule(config, type);
      expect(config.rules.at(-1)?.type).toBe(type);
      expect(valid(config)).toBe(true);
    }
    const last = config.rules.at(-1)?.id ?? '';
    expect(removeRule(config, last).rules.some((r) => r.id === last)).toBe(false);
  });

  it('starts conditions at the default and lists colour choices', () => {
    const config = chair();
    const byId = (id: string) => {
      const g = config.groups.find((x) => x.id === id);
      if (!g) throw new Error(id);
      return g;
    };
    expect(defaultCondition(byId('fabric'))).toEqual({ group: 'fabric', equals: 'original' });
    expect(defaultCondition(byId('pillow-navy'))).toEqual({ group: 'pillow-navy', equals: true });
    expect(defaultCondition(byId('diameter'))).toEqual({ group: 'diameter', min: 120 });
    const fabric = byId('fabric');
    if (fabric.type !== 'color') throw new Error('fabric');
    const ids = colorOptions(fabric).map((o) => o.id);
    expect(ids[0]).toBe('original');
    expect(ids.at(-1)).toBe('custom');
  });

  it("doesn't add rules without options", () => {
    const empty = { ...chair(), groups: [], rules: [] };
    expect(addRule(empty, 'requires')).toBe(empty);
  });
});
