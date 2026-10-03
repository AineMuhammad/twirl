import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { imageSize, inspectModel, readReport } from './model-report';

const sample = (name: string) =>
  new Uint8Array(readFileSync(resolve(import.meta.dirname, '../../public/samples', name)));

const gltf = (json: object) => new TextEncoder().encode(JSON.stringify(json));

const triangle = {
  asset: { version: '2.0' },
  scenes: [{ nodes: [0] }],
  nodes: [{ name: 'Seat', mesh: 0 }],
  meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
  accessors: [{ count: 3 }],
};

describe('inspectModel', () => {
  it('reports the sample chair like the viewer does, with WebP texture sizes', () => {
    const report = inspectModel(sample('sofa.glb'), 'sofa.glb');
    expect(report.errors).toEqual([]);
    expect(report.meshCount).toBe(4);
    expect(report.triangleCount).toBe(35_350);
    expect(report.extensionsRequired).toContain('KHR_draco_mesh_compression');
    expect(report.textures).toHaveLength(9);
    expect(report.textures.every((t) => t.mimeType === 'image/webp' && (t.width ?? 0) > 0)).toBe(
      true,
    );
  });

  it('reads the untextured sample', () => {
    const report = inspectModel(sample('jeep_2021.glb'), 'jeep_2021.glb');
    expect(report).toMatchObject({ errors: [], meshCount: 15, textures: [] });
    expect(report.triangleCount).toBeGreaterThan(0);
  });

  it('accepts a minimal embedded .gltf and counts instances', () => {
    const twice = {
      ...triangle,
      scenes: [{ nodes: [0, 1] }],
      nodes: [...triangle.nodes, { name: 'Seat 2', mesh: 0 }],
    };
    const report = inspectModel(gltf(twice), 'chair.gltf');
    expect(report).toMatchObject({ errors: [], format: 'gltf', meshCount: 2, triangleCount: 2 });
  });

  it('rejects unreadable, empty and unsupported files with clear errors', () => {
    expect(inspectModel(new Uint8Array([1, 2, 3]), 'x.glb').errors[0]).toMatch(/valid \.glb/);
    expect(inspectModel(gltf({ asset: { version: '2.0' } }), 'x.gltf').errors).toContain(
      "This model doesn't contain any meshes.",
    );
    expect(
      inspectModel(gltf({ ...triangle, asset: { version: '1.0' } }), 'x.gltf').errors[0],
    ).toMatch(/glTF 2\.0/);
    expect(
      inspectModel(gltf({ ...triangle, buffers: [{ uri: 'chair.bin' }] }), 'x.gltf').errors[0],
    ).toMatch(/separate \.bin/);
    expect(
      inspectModel(gltf({ ...triangle, extensionsRequired: ['ACME_magic'] }), 'x.gltf').errors[0],
    ).toMatch(/ACME_magic/);
    expect(inspectModel(new TextEncoder().encode('{nope'), 'x.gltf').errors[0]).toMatch(/JSON/);
  });

  it('warns about unnamed meshes and heavy geometry', () => {
    const heavy = {
      ...triangle,
      nodes: [{ mesh: 0 }],
      accessors: [{ count: 3 * 600_000 }],
    };
    const codes = inspectModel(gltf(heavy), 'x.gltf').warnings.map((w) => w.code);
    expect(codes).toEqual(['many-triangles', 'unnamed-meshes']);
  });

  it('survives node cycles', () => {
    const cyclic = { ...triangle, nodes: [{ name: 'A', mesh: 0, children: [0] }] };
    expect(inspectModel(gltf(cyclic), 'x.gltf').meshCount).toBe(1);
  });
});

describe('imageSize', () => {
  it('reads PNG and KTX2 headers', () => {
    const png = new Uint8Array(24);
    png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    new DataView(png.buffer).setUint32(16, 2048);
    new DataView(png.buffer).setUint32(20, 1024);
    expect(imageSize(png)).toEqual({ width: 2048, height: 1024 });

    const ktx2 = new Uint8Array(28);
    ktx2.set([0xab, 0x4b, 0x54, 0x58]);
    new DataView(ktx2.buffer).setUint32(20, 512, true);
    new DataView(ktx2.buffer).setUint32(24, 256, true);
    expect(imageSize(ktx2)).toEqual({ width: 512, height: 256 });
    expect(imageSize(new Uint8Array([1, 2, 3]))).toBeNull();
  });
});

describe('readReport', () => {
  it('reads current reports, legacy error-only rows and junk', () => {
    const report = inspectModel(sample('sofa.glb'), 'sofa.glb');
    expect(readReport(JSON.parse(JSON.stringify(report))).report?.meshCount).toBe(4);
    expect(readReport({ errors: ['Size mismatch'] })).toEqual({
      report: null,
      errors: ['Size mismatch'],
      warnings: [],
    });
    expect(readReport(null).report).toBeNull();
    expect(readReport('nope').errors).toEqual([]);
  });
});
