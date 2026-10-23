import { BufferAttribute, BufferGeometry, Mesh, MeshStandardMaterial, Texture } from 'three';
import { describe, expect, it } from 'vitest';

import {
  applyLibraryMaterial,
  MATERIAL_TILE_METERS,
  metersPerUv,
  setSheen,
  toPhysical,
} from './materials';

/** A flat `size` × `size` metre square, UV-mapped to `uvSize` × `uvSize`. */
function square(size: number, uvSize: number, withUv = true) {
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    'position',
    new BufferAttribute(new Float32Array([0, 0, 0, size, 0, 0, size, size, 0, 0, size, 0]), 3),
  );
  if (withUv) {
    geometry.setAttribute(
      'uv',
      new BufferAttribute(new Float32Array([0, 0, uvSize, 0, uvSize, uvSize, 0, uvSize]), 2),
    );
  }
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  return new Mesh(geometry, new MeshStandardMaterial());
}

const textures = () => ({ color: new Texture(), normal: new Texture(), roughness: new Texture() });

describe('metersPerUv', () => {
  it('measures surface metres per unit of texture space', () => {
    expect(metersPerUv(square(2, 1))).toBeCloseTo(2);
    expect(metersPerUv(square(2, 0.5))).toBeCloseTo(4);
  });

  it('accounts for the mesh being scaled in the scene', () => {
    const mesh = square(1, 1);
    mesh.scale.setScalar(3);
    expect(metersPerUv(mesh)).toBeCloseTo(3);
  });

  it('is null without UVs', () => {
    expect(metersPerUv(square(1, 1, false))).toBeNull();
  });
});

describe('applyLibraryMaterial', () => {
  it('tiles the texture set to true size and drops the old maps', () => {
    const mesh = square(2, 1); // 2 m per UV unit
    const material = mesh.material as MeshStandardMaterial;
    material.metalnessMap = new Texture();
    expect(applyLibraryMaterial(material, mesh, textures(), 0.25)).toBe(true);
    expect(material.map?.repeat.x).toBeCloseTo(8); // 2 m / 0.25 m tiles
    expect(material.normalMap?.repeat.y).toBeCloseTo(8);
    expect(material.metalnessMap).toBeNull();
    expect(material.metalness).toBe(0);
  });

  it('leaves parts without UVs alone', () => {
    const mesh = square(1, 1, false);
    const material = mesh.material as MeshStandardMaterial;
    expect(applyLibraryMaterial(material, mesh, textures(), 0.25)).toBe(false);
    expect(material.map).toBeNull();
  });

  it('knows a tile size for every library material', () => {
    for (const meters of Object.values(MATERIAL_TILE_METERS)) expect(meters).toBeGreaterThan(0);
  });
});

describe('sheen', () => {
  it('makes a physical copy, never touching the original', () => {
    const original = new MeshStandardMaterial({ roughness: 0.4 });
    const physical = toPhysical(original);
    expect(physical).not.toBe(original);
    expect(physical.isMeshPhysicalMaterial).toBe(true);
    expect(physical.roughness).toBeCloseTo(0.4);
    const again = toPhysical(physical);
    expect(again).not.toBe(physical);
  });

  it('gives velvet a sheen in a lighter shade of its dye, and leather none', () => {
    const velvet = toPhysical(new MeshStandardMaterial());
    setSheen(velvet, 'velvet', '#802020');
    expect(velvet.sheen).toBe(1);
    expect(velvet.sheenColor.r).toBeGreaterThan(velvet.sheenColor.g); // still red
    const leather = toPhysical(new MeshStandardMaterial());
    setSheen(leather, 'leather', '#802020');
    expect(leather.sheen).toBe(0);
  });
});
