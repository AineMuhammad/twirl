import { Box3, Group, Matrix4, type Object3D, Vector3 } from 'three';

import type { Deformation } from '../types';
import type { NodeId } from './mesh-tree';

type Vec3 = readonly [number, number, number];

/**
 * The model-space matrix for one part: 'stretch' scales it by `scale` about `origin`; 'anchor'
 * keeps its size but moves its centre as if it had been scaled (so a cushion stays on a seat
 * that grows).
 */
export function deformationMatrix(
  mode: Deformation['mode'],
  scale: Vec3,
  origin: Vec3,
  partCenter: Vec3,
): Matrix4 {
  const [sx, sy, sz] = scale;
  if (mode === 'anchor') {
    return new Matrix4().makeTranslation(
      (sx - 1) * (partCenter[0] - origin[0]),
      (sy - 1) * (partCenter[1] - origin[1]),
      (sz - 1) * (partCenter[2] - origin[2]),
    );
  }
  const [ox, oy, oz] = origin;
  return new Matrix4()
    .makeTranslation(ox, oy, oz)
    .multiply(new Matrix4().makeScale(sx, sy, sz))
    .multiply(new Matrix4().makeTranslation(-ox, -oy, -oz));
}

const WRAPPER = 'twirlDeformWrapper';

/**
 * Applies dimension changes to a model. Each deformed node gets a wrapper group between it and
 * its parent, holding the change; the node keeps its own transform, so animations still play.
 * Changes compose in model space, centred on the bottom-centre of the model (sizes grow from
 * the floor).
 */
export class DeformationApplier {
  private readonly wrappers = new Map<Object3D, Group>();

  constructor(
    private readonly root: Object3D,
    private readonly index: ReadonlyMap<NodeId, Object3D>,
  ) {}

  apply(deformations: readonly Deformation[]) {
    // Measure the undeformed model.
    for (const wrapper of this.wrappers.values()) wrapper.matrix.identity();
    this.root.updateMatrixWorld(true);
    const rootInverse = this.root.matrixWorld.clone().invert();
    const box = new Box3();
    this.root.traverse((o) => {
      if ('isMesh' in o && o.isMesh) box.expandByObject(o);
    });
    if (box.isEmpty()) return;
    box.applyMatrix4(rootInverse);
    const center = box.getCenter(new Vector3());
    const origin: Vec3 = [center.x, box.min.y, center.z];

    const changes = new Map<Object3D, Matrix4>();
    for (const deformation of deformations) {
      const objects = deformation.nodeIds
        .map((id) => this.index.get(id))
        .filter((o): o is Object3D => o !== undefined);
      const targets = objects.filter((o) => !objects.some((a) => a !== o && isAncestor(a, o)));
      for (const object of targets) {
        const partBox = new Box3().setFromObject(object).applyMatrix4(rootInverse);
        const partCenter = partBox.isEmpty() ? center : partBox.getCenter(new Vector3());
        const m = deformationMatrix(
          deformation.mode,
          deformation.scale,
          origin,
          partCenter.toArray(),
        );
        changes.set(object, m.multiply(changes.get(object) ?? new Matrix4()));
      }
    }

    for (const [object, change] of changes) {
      const wrapper = this.wrapperFor(object);
      const parent = wrapper.parent;
      if (!parent) continue;
      // Express the model-space change in the wrapper's parent space.
      const parentInModel = rootInverse.clone().multiply(parent.matrixWorld);
      wrapper.matrix.copy(parentInModel.clone().invert()).multiply(change).multiply(parentInModel);
    }
    this.root.updateMatrixWorld(true);
  }

  private wrapperFor(object: Object3D): Group {
    let wrapper = this.wrappers.get(object);
    if (wrapper) return wrapper;
    wrapper = new Group();
    wrapper.name = WRAPPER;
    wrapper.matrixAutoUpdate = false;
    const parent = object.parent;
    if (parent) {
      // Keep the node's place among its siblings.
      const at = parent.children.indexOf(object);
      parent.remove(object);
      parent.add(wrapper);
      parent.children.splice(parent.children.indexOf(wrapper), 1);
      parent.children.splice(at, 0, wrapper);
    }
    wrapper.add(object);
    this.wrappers.set(object, wrapper);
    return wrapper;
  }
}

function isAncestor(ancestor: Object3D, object: Object3D) {
  for (let p = object.parent; p; p = p.parent) if (p === ancestor) return true;
  return false;
}
