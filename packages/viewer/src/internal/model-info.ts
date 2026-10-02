import type { AnimationClip, BufferGeometry, Mesh, Object3D } from 'three';

import type { ModelInfo } from '../types';

function triangleCount(geometry: BufferGeometry) {
  const count = geometry.index ? geometry.index.count : (geometry.attributes.position?.count ?? 0);
  return Math.floor(count / 3);
}

export function describeModel(root: Object3D, animations: AnimationClip[]): ModelInfo {
  let meshCount = 0;
  let triangles = 0;
  root.traverse((object) => {
    const mesh = object as Mesh;
    if (mesh.isMesh) {
      meshCount += 1;
      triangles += triangleCount(mesh.geometry);
    }
  });
  return { meshCount, triangleCount: triangles, animationNames: animations.map((a) => a.name) };
}
