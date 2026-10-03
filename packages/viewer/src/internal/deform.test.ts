import { Box3, BoxGeometry, Group, Mesh, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';

import { DeformationApplier, deformationMatrix } from './deform';
import { indexNodes } from './mesh-tree';

const apply = (m: ReturnType<typeof deformationMatrix>, p: [number, number, number]) =>
  new Vector3(...p).applyMatrix4(m).toArray();

describe('deformationMatrix', () => {
  it('stretch scales about the origin', () => {
    const m = deformationMatrix('stretch', [2, 1, 1], [1, 0, 0], [0, 0, 0]);
    expect(apply(m, [2, 3, 4])).toEqual([3, 3, 4]);
  });

  it('anchor moves the part centre as if scaled, without resizing', () => {
    const m = deformationMatrix('anchor', [1.5, 1, 1], [0, 0, 0], [2, 0, 0]);
    expect(apply(m, [2, 0, 0])).toEqual([3, 0, 0]);
    expect(apply(m, [3, 0, 0])).toEqual([4, 0, 0]);
  });
});

/** A 2-wide seat at the centre with a cushion on its right, under a rotated group. */
function chair() {
  const root = new Group();
  const frame = new Group();
  frame.name = 'Frame';
  frame.rotation.y = Math.PI / 2;
  const seat = new Mesh(new BoxGeometry(2, 1, 2));
  seat.name = 'Seat';
  seat.position.y = 0.5;
  const cushion = new Mesh(new BoxGeometry(0.5, 0.5, 0.5));
  cushion.name = 'Cushion';
  cushion.position.set(0, 0.5, -0.75); // world -x after the frame's rotation
  frame.add(seat, cushion);
  root.add(frame);
  return { root, seat, cushion };
}

describe('DeformationApplier', () => {
  it('stretches and anchors in model space, and resets', () => {
    const { root, seat, cushion } = chair();
    const index = indexNodes(root);
    const id = (o: object) => [...index].find(([, v]) => v === o)?.[0] ?? '';
    const applier = new DeformationApplier(root, index);

    applier.apply([
      { nodeIds: [id(seat)], mode: 'stretch', scale: [1.5, 1, 1] },
      { nodeIds: [id(cushion)], mode: 'anchor', scale: [1.5, 1, 1] },
    ]);
    const seatBox = new Box3().setFromObject(seat);
    expect(seatBox.min.x).toBeCloseTo(-1.5);
    expect(seatBox.max.x).toBeCloseTo(1.5);
    const cushionBox = new Box3().setFromObject(cushion);
    expect(cushionBox.getCenter(new Vector3()).x).toBeCloseTo(-0.75 * 1.5);
    expect(cushionBox.max.x - cushionBox.min.x).toBeCloseTo(0.5);

    applier.apply([]);
    expect(new Box3().setFromObject(seat).max.x).toBeCloseTo(1);
    // Nodes keep their parent's child order behind the wrapper.
    expect(root.children[0]?.children.map((c) => c.children[0]?.name)).toEqual(['Seat', 'Cushion']);
  });
});
