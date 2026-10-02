import { type Mesh, type Object3D, type SkinnedMesh } from 'three';
import { acceleratedRaycast, MeshBVH } from 'three-mesh-bvh';

function isMesh(object: Object3D): object is Mesh {
  return (object as Mesh).isMesh === true;
}

/**
 * Gives one mesh a bounding-volume hierarchy so raycasts test a handful of triangles instead of
 * all of them (~45 ms → <1 ms on the 457k-triangle sample). Applied per mesh, never by patching
 * three's prototypes, so the host app's other meshes are unaffected. Skinned meshes are skipped:
 * a BVH would only match their bind pose.
 */
export function ensureBvh(mesh: Mesh) {
  if ((mesh as SkinnedMesh).isSkinnedMesh) return;
  if (!mesh.geometry.boundsTree) mesh.geometry.boundsTree = new MeshBVH(mesh.geometry);
  mesh.raycast = acceleratedRaycast;
}

type IdleScheduler = (callback: () => void) => () => void;

const onIdle: IdleScheduler =
  typeof requestIdleCallback === 'function'
    ? (callback) => {
        const handle = requestIdleCallback(callback, { timeout: 2000 });
        return () => cancelIdleCallback(handle);
      }
    : (callback) => {
        const handle = setTimeout(callback, 16);
        return () => clearTimeout(handle);
      };

/**
 * Builds BVHs for every mesh under `root` one mesh per idle period, so loading and the first
 * frames aren't blocked. `flush()` builds whatever is left immediately (call before raycasting).
 */
export function scheduleBvhBuild(root: Object3D, schedule: IdleScheduler = onIdle) {
  const pending: Mesh[] = [];
  root.traverse((object) => {
    if (isMesh(object)) pending.push(object);
  });
  let cancel: (() => void) | null = null;

  const step = () => {
    cancel = null;
    const next = pending.shift();
    if (next) ensureBvh(next);
    if (pending.length > 0) cancel = schedule(step);
  };
  if (pending.length > 0) cancel = schedule(step);

  return {
    flush() {
      cancel?.();
      cancel = null;
      while (pending.length > 0) ensureBvh(pending.shift() as Mesh);
    },
    cancel() {
      cancel?.();
      cancel = null;
    },
    get remaining() {
      return pending.length;
    },
  };
}
