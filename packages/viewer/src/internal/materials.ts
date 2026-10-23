import type { MaterialId } from '@twirl/config-schema/constants';
import {
  type BufferGeometry,
  Color,
  type Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
  TextureLoader,
  Vector3,
} from 'three';

/**
 * Real-world size of one repeat of each library texture, in metres (from the source scans, see
 * tools/materials). Parts are tiled to it, so a velvet's pile or an oak board reads true to size.
 */
export const MATERIAL_TILE_METERS: Record<MaterialId, number> = {
  velvet: 0.284,
  linen: 0.271,
  boucle: 0.336,
  herringbone: 0.27,
  corduroy: 0.266,
  jacquard: 0.28,
  leather: 0.4,
  'grained-leather': 0.3,
  oak: 1.83,
  walnut: 1,
  teak: 1,
  cherry: 1,
  sheesham: 2.43,
};

/**
 * Sheen for fabrics with a pile (velvet's soft shine where light grazes it): `intensity` 0–1 and
 * how spread the shine is (`roughness`). Parts with sheen are upgraded to a physical material.
 */
export const MATERIAL_SHEEN: Partial<Record<MaterialId, { intensity: number; roughness: number }>> =
  {
    velvet: { intensity: 1, roughness: 0.35 },
    corduroy: { intensity: 0.6, roughness: 0.45 },
    boucle: { intensity: 0.3, roughness: 0.6 },
  };

/** A physical copy of a material (same maps and settings), so it can have sheen. */
export function toPhysical(material: MeshStandardMaterial): MeshPhysicalMaterial {
  // Always a new material: the original is shared and must stay untouched.
  if ((material as MeshPhysicalMaterial).isMeshPhysicalMaterial) {
    return (material as MeshPhysicalMaterial).clone();
  }
  const physical = new MeshPhysicalMaterial();
  MeshStandardMaterial.prototype.copy.call(physical, material);
  physical.defines = { STANDARD: '', PHYSICAL: '' };
  return physical;
}

/** Sheen in a lighter shade of the fabric's dye, as light catches a pile. */
export function setSheen(material: MeshPhysicalMaterial, id: MaterialId, dye: string) {
  const sheen = MATERIAL_SHEEN[id];
  if (!sheen) return;
  material.sheen = sheen.intensity;
  material.sheenRoughness = sheen.roughness;
  material.sheenColor.set(dye).lerp(WHITE, 0.45);
}

const WHITE = new Color(1, 1, 1);

export interface MaterialTextures {
  color: Texture;
  normal: Texture;
  roughness: Texture;
}

const MAP_FILES = { color: 'color.webp', normal: 'normal.webp', roughness: 'roughness.webp' };

/**
 * Loads library texture sets on demand from `baseUrl` (`<base><id>/color.webp` …) and caches
 * them for the page's lifetime. `get` is synchronous once loaded; `load` starts (or joins) a load.
 */
export class MaterialLibrary {
  private readonly loaded = new Map<MaterialId, MaterialTextures>();
  private readonly loading = new Map<MaterialId, Promise<MaterialTextures>>();
  private readonly loader = new TextureLoader();

  constructor(private readonly baseUrl: string) {}

  get(id: MaterialId): MaterialTextures | null {
    return this.loaded.get(id) ?? null;
  }

  load(id: MaterialId): Promise<MaterialTextures> {
    const existing = this.loading.get(id);
    if (existing) return existing;
    const one = (file: string) => this.loader.loadAsync(`${this.baseUrl}${id}/${file}`);
    const promise = Promise.all([
      one(MAP_FILES.color),
      one(MAP_FILES.normal),
      one(MAP_FILES.roughness),
    ]).then(([color, normal, roughness]) => {
      color.colorSpace = SRGBColorSpace;
      for (const texture of [color, normal, roughness]) {
        texture.wrapS = texture.wrapT = RepeatWrapping;
        texture.anisotropy = 8;
      }
      const textures = { color, normal, roughness };
      this.loaded.set(id, textures);
      return textures;
    });
    this.loading.set(id, promise);
    promise.catch(() => this.loading.delete(id)); // allow a retry after a failure
    return promise;
  }
}

const libraries = new Map<string, MaterialLibrary>();

/** One library per base URL, shared by every viewer on the page (textures load once). */
export function materialLibrary(baseUrl: string) {
  let library = libraries.get(baseUrl);
  if (!library) {
    library = new MaterialLibrary(baseUrl);
    libraries.set(baseUrl, library);
  }
  return library;
}

/**
 * Metres of surface per unit of texture space on this mesh (the square root of world area over
 * UV area), or null without usable UVs. Repeating a texture `metres / tile` times then shows it
 * at true size, whatever scale the model was unwrapped at.
 */
export function metersPerUv(mesh: Mesh): number | null {
  const geometry: BufferGeometry = mesh.geometry;
  const position = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  if (!position || !uv) return null;
  mesh.updateWorldMatrix(true, false);
  const index = geometry.getIndex();
  const count = index ? index.count : position.count;
  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  let world = 0;
  let texture = 0;
  // Sample up to ~4000 triangles: plenty for a stable ratio on large meshes.
  const step = Math.max(1, Math.floor(count / 3 / 4000)) * 3;
  for (let i = 0; i + 2 < count; i += step) {
    const [i0, i1, i2] = index
      ? [index.getX(i), index.getX(i + 1), index.getX(i + 2)]
      : [i, i + 1, i + 2];
    a.fromBufferAttribute(position, i0).applyMatrix4(mesh.matrixWorld);
    b.fromBufferAttribute(position, i1).applyMatrix4(mesh.matrixWorld);
    c.fromBufferAttribute(position, i2).applyMatrix4(mesh.matrixWorld);
    world += b.sub(a).cross(c.sub(a)).length() / 2;
    const u0 = uv.getX(i0);
    const v0 = uv.getY(i0);
    texture +=
      Math.abs((uv.getX(i1) - u0) * (uv.getY(i2) - v0) - (uv.getX(i2) - u0) * (uv.getY(i1) - v0)) /
      2;
  }
  if (world <= 0 || texture <= 1e-12) return null;
  return Math.sqrt(world / texture);
}

/**
 * Puts a library texture set on a (private, cloned) material, tiled to true size for `mesh`.
 * The material's own colour, relief and roughness maps are replaced; its ambient occlusion and
 * the rest of its settings stay. Returns false (leaving the material alone) without UVs.
 */
export function applyLibraryMaterial(
  material: MeshStandardMaterial,
  mesh: Mesh,
  textures: MaterialTextures,
  tileMeters: number,
): boolean {
  const meters = metersPerUv(mesh);
  if (meters === null || !material.isMeshStandardMaterial) return false;
  const repeat = meters / tileMeters;
  // Per-mesh copies (sharing the image) so each part can repeat at its own scale.
  const tiled = (texture: Texture) => {
    const copy = texture.clone();
    copy.repeat.set(repeat, repeat);
    copy.needsUpdate = true;
    return copy;
  };
  material.map = tiled(textures.color);
  material.normalMap = tiled(textures.normal);
  material.roughnessMap = tiled(textures.roughness);
  material.metalnessMap = null;
  material.metalness = 0;
  material.roughness = 1;
  material.color.set(0xffffff);
  material.needsUpdate = true;
  return true;
}
