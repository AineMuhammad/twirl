import type { BufferGeometry, Material, Mesh, Object3D, Texture } from 'three';

function isTexture(value: unknown): value is Texture {
  return typeof value === 'object' && value !== null && (value as Texture).isTexture === true;
}

/** Closes a decoded ImageBitmap so its (often large) pixel memory is released immediately. */
function closeImageBitmap(texture: Texture) {
  const data: unknown = texture.source?.data;
  if (
    typeof data === 'object' &&
    data !== null &&
    'close' in data &&
    typeof data.close === 'function'
  ) {
    (data as { close: () => void }).close();
  }
}

export interface DisposeOptions {
  /**
   * Also release decoded image memory. Only do this when nothing else (e.g. another viewer
   * showing the same cached model) still uses the textures.
   */
  closeImageBitmaps?: boolean;
}

/**
 * Frees the GPU resources (and optionally decoded images) of everything under `root`.
 * Shared geometries, materials and textures are disposed once.
 */
export function disposeObject3D(
  root: Object3D,
  { closeImageBitmaps = false }: DisposeOptions = {},
) {
  const geometries = new Set<BufferGeometry>();
  const materials = new Set<Material>();
  const textures = new Set<Texture>();

  root.traverse((object) => {
    const mesh = object as Mesh;
    if (mesh.geometry) geometries.add(mesh.geometry);
    if (mesh.material) {
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        materials.add(material);
      }
    }
  });

  for (const material of materials) {
    for (const value of Object.values(material)) {
      if (isTexture(value)) textures.add(value);
    }
  }

  for (const texture of textures) {
    texture.dispose();
    if (closeImageBitmaps) closeImageBitmap(texture);
  }
  for (const material of materials) material.dispose();
  for (const geometry of geometries) geometry.dispose();

  return { geometries: geometries.size, materials: materials.size, textures: textures.size };
}

/**
 * Runs `dispose` after the current task unless cancelled first. React StrictMode unmounts and
 * immediately remounts components in development; cancelling on remount keeps resources that
 * are about to be reused, while a real unmount still cleans up.
 */
export function createDeferredDisposer(dispose: () => void) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return {
    schedule() {
      if (timer === null)
        timer = setTimeout(() => {
          timer = null;
          dispose();
        }, 0);
    },
    cancel() {
      if (timer !== null) clearTimeout(timer);
      timer = null;
    },
  };
}
