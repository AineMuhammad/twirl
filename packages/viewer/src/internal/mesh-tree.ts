import type { Material, Mesh, Object3D } from 'three';

import type { MeshTreeNode } from '../types';

/** Stable id for a node: its child-index path from the model root, e.g. "0/2/1". */
export type NodeId = string;

function isMesh(object: Object3D): object is Mesh {
  return (object as Mesh).isMesh === true;
}

function triangles(mesh: Mesh) {
  const g = mesh.geometry;
  const count = g.index ? g.index.count : (g.attributes.position?.count ?? 0);
  return Math.floor(count / 3);
}

function materialNames(mesh: Mesh) {
  const list: Material[] = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  return list.map((m) => m.name);
}

function containsMesh(object: Object3D): boolean {
  return isMesh(object) || object.children.some(containsMesh);
}

/**
 * The model's node hierarchy, keeping only branches that contain meshes (empty helpers,
 * cameras and lights are dropped). Ids are index paths, so they're stable for the same file
 * even when names are empty or duplicated.
 */
export function buildMeshTree(root: Object3D): MeshTreeNode[] {
  let unnamed = 0;
  const visit = (object: Object3D, id: NodeId): MeshTreeNode | null => {
    if (!containsMesh(object)) return null;
    const children = object.children
      .map((child, i) => visit(child, `${id}/${i}`))
      .filter((n): n is MeshTreeNode => n !== null);
    const mesh = isMesh(object) ? object : null;
    const name = object.name.trim();
    return {
      id,
      name: name || `Unnamed ${mesh ? 'mesh' : 'group'} ${++unnamed}`,
      hasName: name.length > 0,
      kind: mesh ? 'mesh' : 'group',
      triangleCount: mesh ? triangles(mesh) : children.reduce((n, c) => n + c.triangleCount, 0),
      materialNames: mesh ? materialNames(mesh) : [],
      children,
    };
  };
  return root.children
    .map((child, i) => visit(child, String(i)))
    .filter((n): n is MeshTreeNode => n !== null);
}

/** Maps every node id (meshes and groups) to its object, for applying overrides. */
export function indexNodes(root: Object3D): Map<NodeId, Object3D> {
  const index = new Map<NodeId, Object3D>();
  const visit = (object: Object3D, id: NodeId) => {
    index.set(id, object);
    object.children.forEach((child, i) => visit(child, `${id}/${i}`));
  };
  root.children.forEach((child, i) => visit(child, String(i)));
  return index;
}

/** Flattens the tree depth-first, e.g. for warnings or search. */
export function flattenTree(nodes: readonly MeshTreeNode[]): MeshTreeNode[] {
  return nodes.flatMap((n) => [n, ...flattenTree(n.children)]);
}
