import { Group, type Intersection, Mesh, type Object3D } from 'three';
import { describe, expect, it } from 'vitest';

import { isClick, pickMeshId } from './picking';

const hit = (object: Object3D, distance: number) => ({ object, distance }) as Intersection;

describe('isClick', () => {
  it('accepts a short, still press', () => {
    expect(isClick({ x: 10, y: 10, time: 0 }, { x: 13, y: 12, time: 150 })).toBe(true);
  });
  it('rejects a drag (orbiting)', () => {
    expect(isClick({ x: 10, y: 10, time: 0 }, { x: 40, y: 10, time: 150 })).toBe(false);
  });
  it('rejects a long press', () => {
    expect(isClick({ x: 10, y: 10, time: 0 }, { x: 10, y: 10, time: 900 })).toBe(false);
  });
});

describe('pickMeshId', () => {
  const front = new Mesh();
  const back = new Mesh();
  const idOf = new Map<Object3D, string>([
    [front, '0'],
    [back, '1'],
  ]);

  it('returns the nearest hit', () => {
    expect(pickMeshId([hit(front, 1), hit(back, 2)], idOf)).toBe('0');
  });

  it('skips hidden meshes and meshes in hidden groups', () => {
    const hidden = new Mesh();
    hidden.visible = false;
    const group = new Group();
    group.visible = false;
    const inHidden = new Mesh();
    group.add(inHidden);
    const ids = new Map<Object3D, string>([...idOf, [hidden, 'h'], [inHidden, 'g']]);
    expect(pickMeshId([hit(hidden, 0.5), hit(inHidden, 0.7), hit(back, 2)], ids)).toBe('1');
  });

  it('returns null when nothing (known) was hit', () => {
    expect(pickMeshId([], idOf)).toBeNull();
    expect(pickMeshId([hit(new Mesh(), 1)], idOf)).toBeNull();
  });
});
