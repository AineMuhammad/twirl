import {
  BoxGeometry,
  BufferAttribute,
  DataTexture,
  Mesh,
  MeshStandardMaterial,
  RGBAFormat,
  SRGBColorSpace,
  type WebGLProgramParametersWithUniforms,
} from 'three';
import { describe, expect, it } from 'vitest';

import { DETAIL_MAP_FRAGMENT, meanLuminanceForMesh, prepareForTint } from './tint';

/** 2×1 atlas: left texel near-black ("metal"), right texel white ("fabric"). */
function atlas() {
  const data = new Uint8Array([10, 10, 10, 255, 255, 255, 255, 255]);
  const t = new DataTexture(data, 2, 1, RGBAFormat);
  t.colorSpace = SRGBColorSpace;
  t.flipY = false;
  return t;
}

function meshWithUvs(us: number[]) {
  const g = new BoxGeometry();
  const uv = new Float32Array((g.attributes.position?.count ?? 0) * 2);
  for (let i = 0; i < uv.length / 2; i++) {
    uv[i * 2] = us[i % us.length] ?? 0;
    uv[i * 2 + 1] = 0.5;
  }
  g.setAttribute('uv', new BufferAttribute(uv, 2));
  return new Mesh(g, new MeshStandardMaterial());
}

describe('meanLuminanceForMesh', () => {
  it('measures only the atlas region the mesh uses', () => {
    const t = atlas();
    const metal = meanLuminanceForMesh(meshWithUvs([0.1, 0.2, 0.4]), t);
    const fabric = meanLuminanceForMesh(meshWithUvs([0.6, 0.9]), t);
    expect(metal).toBeLessThan(0.01); // dark: so the tint isn't crushed to black
    expect(fabric).toBeCloseTo(1, 2);
  });

  it('falls back to 0.5 without readable pixels', () => {
    expect(meanLuminanceForMesh(meshWithUvs([0.5]), atlas(), null)).toBe(0.5);
  });
});

describe('prepareForTint', () => {
  it('patches the map shader with a mesh-specific mean, once', () => {
    const mesh = meshWithUvs([0.1]);
    const material = new MeshStandardMaterial({ map: atlas() });
    prepareForTint(material, mesh);
    const first = material.onBeforeCompile;
    prepareForTint(material, mesh);
    expect(material.onBeforeCompile).toBe(first);

    const shader = {
      uniforms: {},
      fragmentShader: 'void main() {\n#include <map_fragment>\n}',
    } as unknown as WebGLProgramParametersWithUniforms;
    material.onBeforeCompile(shader, undefined as never);
    expect(shader.fragmentShader).toContain(DETAIL_MAP_FRAGMENT.trim().split('\n')[0]);
    expect(shader.fragmentShader).not.toContain('#include <map_fragment>');
    expect((shader.uniforms.twirlMapMean as { value: number }).value).toBeLessThan(0.01);
    expect(material.customProgramCacheKey()).toBe('twirl-detail-map');
  });

  it('turns off vertex colors, which would also tint the part', () => {
    const material = new MeshStandardMaterial({ vertexColors: true });
    prepareForTint(material, meshWithUvs([0.5]));
    expect(material.vertexColors).toBe(false);
  });

  it('leaves untextured materials on the standard shader', () => {
    const material = new MeshStandardMaterial();
    const before = material.onBeforeCompile;
    prepareForTint(material, meshWithUvs([0.5]));
    expect(material.onBeforeCompile).toBe(before);
  });
});
