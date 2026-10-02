import {
  BoxGeometry,
  type BufferGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PlaneGeometry,
} from 'three';
import { describe, expect, it } from 'vitest';

import { buildMeshTree, flattenTree, indexNodes } from './mesh-tree';

function mesh(name: string, geometry: BufferGeometry = new BoxGeometry(), materialName = 'Mat') {
  const m = new Mesh(geometry, new MeshBasicMaterial({ name: materialName }));
  m.name = name;
  return m;
}

/**
 * root
 * ├─ 0 Body (mesh, 12 tris)
 * ├─ 1 Wheels (group)
 * │  ├─ 1/0 Wheel_FL (mesh)
 * │  └─ 1/1 "" (mesh, unnamed)
 * ├─ 2 Camera_Rig (no meshes → dropped)
 * └─ 3 Glass (mesh, plane, 2 tris)
 */
function model() {
  const root = new Group();
  const wheels = new Group();
  wheels.name = 'Wheels';
  wheels.add(mesh('Wheel_FL'), mesh(''));
  const rig = new Object3D();
  rig.name = 'Camera_Rig';
  root.add(
    mesh('Body', new BoxGeometry(), 'Paint'),
    wheels,
    rig,
    mesh('Glass', new PlaneGeometry(), 'Glass'),
  );
  return root;
}

describe('buildMeshTree', () => {
  it('builds the hierarchy with index-path ids, dropping branches without meshes', () => {
    const tree = buildMeshTree(model());
    expect(tree.map((n) => [n.id, n.name, n.kind])).toEqual([
      ['0', 'Body', 'mesh'],
      ['1', 'Wheels', 'group'],
      ['3', 'Glass', 'mesh'],
    ]);
    expect(tree[1]?.children.map((n) => n.id)).toEqual(['1/0', '1/1']);
  });

  it('labels unnamed nodes and flags them', () => {
    const unnamed = buildMeshTree(model())[1]?.children[1];
    expect(unnamed).toMatchObject({ name: 'Unnamed mesh 1', hasName: false });
  });

  it('sums triangles for groups and lists material names for meshes', () => {
    const [body, wheels, glass] = buildMeshTree(model());
    expect(body).toMatchObject({ triangleCount: 12, materialNames: ['Paint'] });
    expect(wheels).toMatchObject({ triangleCount: 24, materialNames: [] });
    expect(glass?.triangleCount).toBe(2);
  });

  it('gives the same ids for a clone of the same model', () => {
    const root = model();
    expect(flattenTree(buildMeshTree(root.clone())).map((n) => n.id)).toEqual(
      flattenTree(buildMeshTree(root)).map((n) => n.id),
    );
  });
});

describe('indexNodes', () => {
  it('maps ids (including groups and non-mesh nodes) to objects', () => {
    const root = model();
    const index = indexNodes(root);
    expect(index.get('1')?.name).toBe('Wheels');
    expect(index.get('1/0')?.name).toBe('Wheel_FL');
    expect(index.get('2')?.name).toBe('Camera_Rig');
  });
});
