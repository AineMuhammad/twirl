import {
  BoxGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  Raycaster,
  SphereGeometry,
  Vector3,
} from 'three';
import { describe, expect, it } from 'vitest';

import { ensureBvh, scheduleBvhBuild } from './bvh';

function scene() {
  const root = new Group();
  const sphere = new Mesh(new SphereGeometry(1, 64, 64), new MeshBasicMaterial());
  const box = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
  box.position.set(0, 0, -5);
  root.add(sphere, box);
  root.updateMatrixWorld(true);
  return { root, sphere, box };
}

const ray = () => new Raycaster(new Vector3(0, 0.3, 10), new Vector3(0, 0, -1));

describe('ensureBvh', () => {
  it('gives the same nearest hit as an unaccelerated raycast', () => {
    const plain = scene();
    const fast = scene();
    fast.root.traverse((o) => (o as Mesh).isMesh && ensureBvh(o as Mesh));

    const expected = ray().intersectObject(plain.root, true)[0];
    const actual = ray().intersectObject(fast.root, true)[0];
    expect(actual?.object).toBe(fast.sphere);
    expect(actual?.distance).toBeCloseTo(expected?.distance ?? NaN, 5);
    expect(fast.sphere.geometry.boundsTree).toBeDefined();
  });

  it('leaves other meshes and three.js prototypes untouched', () => {
    const { sphere } = scene();
    const untouched = new Mesh(new BoxGeometry(), new MeshBasicMaterial());
    ensureBvh(sphere);
    expect(untouched.raycast).toBe(Mesh.prototype.raycast);
    expect(sphere.raycast).not.toBe(Mesh.prototype.raycast);
  });
});

describe('scheduleBvhBuild', () => {
  it('builds one mesh per idle step', () => {
    const { root, sphere, box } = scene();
    const queue: (() => void)[] = [];
    const build = scheduleBvhBuild(root, (cb) => {
      queue.push(cb);
      return () => undefined;
    });
    expect(build.remaining).toBe(2);
    queue.shift()?.();
    expect(build.remaining).toBe(1);
    expect(sphere.geometry.boundsTree).toBeDefined();
    expect(box.geometry.boundsTree).toBeUndefined();
  });

  it('flush() finishes the rest immediately', () => {
    const { root, box } = scene();
    let cancelled = 0;
    const build = scheduleBvhBuild(root, () => () => cancelled++);
    build.flush();
    expect(build.remaining).toBe(0);
    expect(box.geometry.boundsTree).toBeDefined();
    expect(cancelled).toBe(1);
  });
});
