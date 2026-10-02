import { AnimationClip, BoxGeometry, Group, Mesh, MeshBasicMaterial, PlaneGeometry } from 'three';
import { describe, expect, it } from 'vitest';

import { describeModel } from './model-info';

describe('describeModel', () => {
  it('counts nested meshes and their triangles', () => {
    const root = new Group();
    const child = new Group();
    root.add(new Mesh(new BoxGeometry(), new MeshBasicMaterial())); // 12 triangles
    child.add(new Mesh(new PlaneGeometry(), new MeshBasicMaterial())); // 2 triangles
    root.add(child);

    expect(describeModel(root, [new AnimationClip('Open', 1, [])])).toEqual({
      meshCount: 2,
      triangleCount: 14,
      animationNames: ['Open'],
    });
  });

  it('counts non-indexed geometry by vertices', () => {
    const root = new Group();
    root.add(new Mesh(new BoxGeometry().toNonIndexed(), new MeshBasicMaterial()));
    expect(describeModel(root, []).triangleCount).toBe(12);
  });
});
