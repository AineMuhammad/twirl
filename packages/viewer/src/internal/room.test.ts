import { Box3, BoxGeometry, Group, Mesh, MeshStandardMaterial, Object3D, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import {
  findRoomShells,
  freeOrbitDistance,
  isBehindShell,
  kelvinToColor,
  readRoomAnchors,
  roomInterior,
} from './room';

function anchor(kind: string, position: [number, number, number], extra = {}) {
  const node = new Object3D();
  node.position.set(...position);
  node.userData = { twirl_anchor: kind, ...extra };
  return node;
}

function box(name: string, size: [number, number, number], at: [number, number, number]) {
  const mesh = new Mesh(new BoxGeometry(...size), new MeshStandardMaterial());
  mesh.name = name;
  mesh.position.set(...at);
  return mesh;
}

/** A 6 × 3 × 6 m room centred on x/z 0: floor, four walls, ceiling, art on the back wall. */
function room() {
  const root = new Group();
  root.add(
    box('Room_Floor', [6, 0.01, 6], [0, 0, 0]),
    box('Room_Ceiling', [6, 0.01, 6], [0, 3, 0]),
    box('Wall_Back', [6, 3, 0.2], [0, 1.5, -3.1]),
    box('Wall_Front', [6, 3, 0.2], [0, 1.5, 3.1]),
    box('Wall_Left', [0.2, 3, 6], [-3.1, 1.5, 0]),
    box('Wall_Right', [0.2, 3, 6], [3.1, 1.5, 0]),
    box('Art', [0.8, 0.5, 0.03], [0, 1.5, -2.98]),
    box('Sofa', [2, 0.8, 0.9], [0, 0.4, -2]),
  );
  return root;
}

describe('readRoomAnchors', () => {
  it('reads every anchor kind, relative to the room', () => {
    const root = new Group();
    root.position.set(10, 0, 0); // anchors come back in the room's own space
    root.add(
      anchor('product', [1.8, 0, -4.6]),
      anchor('sun', [-6, 3.6, -4.9], { target: [0.55, 0, -4.75] }),
      anchor('window', [-1.15, 1.6, -5], { target: [3, 1, -5], width: 1.6, height: 1.45 }),
      anchor('sconce', [0, 1.7, -6.2]),
      anchor('sconce', [3.5, 1.7, -6.2]),
      anchor('downlight', [1, 2.66, -3.8], { target: [1, 0, -3.8] }),
      anchor('pendant', [3.3, 2.2, -0.8]),
    );
    const a = readRoomAnchors(root);
    a.product.forEach((v, i) => expect(v).toBeCloseTo([1.8, 0, -4.6][i] ?? 0));
    expect(a.sun?.target).toEqual([0.55, 0, -4.75]);
    expect(a.window).toMatchObject({ width: 1.6, height: 1.45 });
    expect(a.sconces).toHaveLength(2);
    expect(a.downlights[0]?.target).toEqual([1, 0, -3.8]);
    expect(a.pendant?.[1]).toBeCloseTo(2.2);
  });

  it('defaults the product spot to the origin when a room has no anchors', () => {
    expect(readRoomAnchors(new Group())).toMatchObject({ product: [0, 0, 0], sun: null });
  });
});

describe('room shells', () => {
  const shells = findRoomShells(room());
  const byName = (name: string) => shells.find((s) => s.objects[0]?.name === name);

  it('finds the walls and ceiling with their inside faces', () => {
    expect(shells).toHaveLength(5);
    expect(byName('Wall_Back')).toMatchObject({ axis: 2, inward: 1 });
    expect(byName('Wall_Back')?.inner).toBeCloseTo(-3);
    expect(byName('Room_Ceiling')).toMatchObject({ axis: 1, inward: -1 });
  });

  it('hangs wall art on its wall, but not furniture standing in the room', () => {
    const back = byName('Wall_Back')?.objects.map((o) => o.name);
    expect(back).toContain('Art');
    expect(back).not.toContain('Sofa');
  });

  it('hides a wall only when the camera is behind it', () => {
    const back = byName('Wall_Back');
    if (!back) throw new Error('no back wall');
    expect(isBehindShell(back, [0, 1.5, 1])).toBe(false); // inside the room
    expect(isBehindShell(back, [0, 1.5, -4])).toBe(true); // orbited behind the back wall
    const ceiling = byName('Room_Ceiling');
    if (!ceiling) throw new Error('no ceiling');
    expect(isBehindShell(ceiling, [0, 4, 0])).toBe(true); // looking down from above
  });
});

describe('roomInterior', () => {
  it('is the space between the walls and below the ceiling, shrunk by the margin', () => {
    const inside = roomInterior(findRoomShells(room()), 0.2);
    expect(inside?.min.x).toBeCloseTo(-2.8);
    expect(inside?.max.z).toBeCloseTo(2.8);
    expect(inside?.max.y).toBeCloseTo(2.8);
  });

  it('is unbounded (null) for a room missing a wall', () => {
    const open = room();
    open.remove(open.getObjectByName('Wall_Front') as Mesh);
    expect(roomInterior(findRoomShells(open), 0.2)).toBeNull();
  });
});

describe('kelvinToColor', () => {
  it('runs from warm to cool', () => {
    const warm = kelvinToColor(2700);
    const cool = kelvinToColor(7000);
    expect(warm.r).toBeGreaterThan(warm.b);
    expect(cool.b).toBeGreaterThan(warm.b);
    expect(kelvinToColor(6600).r).toBeCloseTo(1, 1);
  });
});

describe('freeOrbitDistance', () => {
  const interior = new Box3(new Vector3(-3, 0, -3), new Vector3(3, 2.8, 3));
  const base = {
    target: [0, 0.5, -2] as [number, number, number],
    interior,
    minDistance: 0.8,
    maxDistance: 6,
  };

  it('reaches across an empty room, but not out of it', () => {
    const d = freeOrbitDistance({ ...base, keepOut: [] });
    expect(d).toBeGreaterThan(2);
    expect(d).toBeLessThan(6);
  });

  it('stops short of a cabinet across the open side', () => {
    const cabinet = new Box3(new Vector3(-3, 0, -0.5), new Vector3(3, 1.2, 0.2)).expandByScalar(
      0.25,
    );
    const free = freeOrbitDistance({ ...base, keepOut: [] });
    const blocked = freeOrbitDistance({ ...base, keepOut: [cabinet] });
    expect(blocked).toBeLessThan(free);
    expect(blocked).toBeGreaterThanOrEqual(base.minDistance + 0.6);
  });
});
