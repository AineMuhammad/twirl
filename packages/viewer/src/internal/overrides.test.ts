import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import { describe, expect, it, vi } from 'vitest';

import { indexNodes } from './mesh-tree';
import { MeshOverrideApplier, resolveOverride } from './overrides';

/** 0 = Frame, 1 = Seat (shares Frame's material), 2 = Pillows group { 2/0, 2/1 } */
function model() {
  const shared = new MeshStandardMaterial({ color: '#ffffff' });
  const frame = new Mesh(new BoxGeometry(), shared);
  const seat = new Mesh(new BoxGeometry(), shared);
  const pillows = new Group();
  const a = new Mesh(new BoxGeometry(), new MeshStandardMaterial({ color: '#ffffff' }));
  const b = new Mesh(new BoxGeometry(), new MeshStandardMaterial({ color: '#ffffff' }));
  pillows.add(a, b);
  const root = new Group();
  root.add(frame, seat, pillows);
  return { root, shared, frame, seat, a, b };
}

const hex = (mesh: Mesh) => `#${(mesh.material as MeshStandardMaterial).color.getHexString()}`;

describe('resolveOverride', () => {
  it('prefers the node, then the closest ancestor', () => {
    const overrides = { '2': { color: '#ff0000' }, '2/1': { color: '#00ff00' } };
    expect(resolveOverride('2/1', overrides, 'color')).toBe('#00ff00');
    expect(resolveOverride('2/0', overrides, 'color')).toBe('#ff0000');
    expect(resolveOverride('0', overrides, 'color')).toBeUndefined();
  });
});

describe('MeshOverrideApplier (color)', () => {
  it('colors one mesh without affecting another that shares its material', () => {
    const m = model();
    new MeshOverrideApplier(indexNodes(m.root)).apply({ '0': { color: '#ff0000' } });
    expect(hex(m.frame)).toBe('#ff0000');
    expect(hex(m.seat)).toBe('#ffffff');
    expect(m.shared.color.getHexString()).toBe('ffffff'); // original untouched
  });

  it('applies a group override to all meshes in the group', () => {
    const m = model();
    new MeshOverrideApplier(indexNodes(m.root)).apply({ '2': { color: '#0000ff' } });
    expect([hex(m.a), hex(m.b)]).toEqual(['#0000ff', '#0000ff']);
  });

  it('restores the original material and disposes the clone when the override is removed', () => {
    const m = model();
    const applier = new MeshOverrideApplier(indexNodes(m.root));
    applier.apply({ '0': { color: '#ff0000' } });
    const clone = m.frame.material as MeshStandardMaterial;
    const spy = vi.spyOn(clone, 'dispose');
    applier.apply({});
    expect(m.frame.material).toBe(m.shared);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('reuses its clone when the color changes (no churn)', () => {
    const m = model();
    const applier = new MeshOverrideApplier(indexNodes(m.root));
    applier.apply({ '0': { color: '#ff0000' } });
    const clone = m.frame.material;
    applier.apply({ '0': { color: '#00ff00' } });
    expect(m.frame.material).toBe(clone);
    expect(hex(m.frame)).toBe('#00ff00');
  });

  it('handles multi-material meshes', () => {
    const root = new Group();
    const mats = [new MeshStandardMaterial(), new MeshStandardMaterial()];
    const mesh = new Mesh(new BoxGeometry(), mats);
    root.add(mesh);
    new MeshOverrideApplier(indexNodes(root)).apply({ '0': { color: '#123456' } });
    const applied = mesh.material as MeshStandardMaterial[];
    expect(applied).not.toBe(mats);
    expect(applied.map((x) => x.color.getHexString())).toEqual(['123456', '123456']);
  });

  it('dispose() puts every original back', () => {
    const m = model();
    const applier = new MeshOverrideApplier(indexNodes(m.root));
    applier.apply({ '0': { color: '#ff0000' }, '2': { color: '#00ff00' } });
    applier.dispose();
    expect(m.frame.material).toBe(m.shared);
    expect(hex(m.a)).toBe('#ffffff');
  });
});

describe('MeshOverrideApplier (visibility)', () => {
  it('hides and shows individual meshes', () => {
    const m = model();
    const applier = new MeshOverrideApplier(indexNodes(m.root));
    applier.apply({ '1': { visible: false } });
    expect([m.frame.visible, m.seat.visible]).toEqual([true, false]);
    applier.apply({ '1': { visible: true } });
    expect(m.seat.visible).toBe(true);
  });

  it('hides a group (and so its subtree) by setting the group itself', () => {
    const m = model();
    new MeshOverrideApplier(indexNodes(m.root)).apply({ '2': { visible: false } });
    expect(m.a.parent?.visible).toBe(false);
    expect(m.a.visible).toBe(true); // children keep their own flag; three skips hidden parents
  });

  it("restores the file's own visibility when the override is removed", () => {
    const m = model();
    m.b.visible = false; // hidden in the source file
    const applier = new MeshOverrideApplier(indexNodes(m.root));
    applier.apply({ '2/1': { visible: true } });
    expect(m.b.visible).toBe(true);
    applier.apply({});
    expect(m.b.visible).toBe(false);
  });

  it('combines color and visibility on the same node', () => {
    const m = model();
    new MeshOverrideApplier(indexNodes(m.root)).apply({
      '0': { color: '#ff0000', visible: false },
    });
    expect(hex(m.frame)).toBe('#ff0000');
    expect(m.frame.visible).toBe(false);
  });

  it('dispose() restores visibility too', () => {
    const m = model();
    const applier = new MeshOverrideApplier(indexNodes(m.root));
    applier.apply({ '0': { visible: false } });
    applier.dispose();
    expect(m.frame.visible).toBe(true);
  });
});
