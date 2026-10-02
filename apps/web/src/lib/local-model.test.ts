import { describe, expect, it } from 'vitest';

import { MAX_MODEL_BYTES } from '@/config/limits';

import { checkLocalModel } from './local-model';

const glbBytes = () => {
  const b = new Uint8Array(12);
  new DataView(b.buffer).setUint32(0, 0x46546c67, true); // "glTF"
  return b;
};
const gltf = (json: object) => new File([JSON.stringify(json)], 'model.gltf');

describe('checkLocalModel', () => {
  it('accepts a .glb with the glTF magic number', async () => {
    expect(await checkLocalModel(new File([glbBytes()], 'Sofa.GLB'))).toEqual({ ok: true });
  });

  it('rejects other file types', async () => {
    const r = await checkLocalModel(new File(['x'], 'model.fbx'));
    expect(r).toMatchObject({ ok: false, message: expect.stringMatching(/\.glb or \.gltf/) });
  });

  it('rejects empty files', async () => {
    expect(await checkLocalModel(new File([], 'a.glb'))).toMatchObject({ ok: false });
  });

  it('rejects files over 15 MB, with the size in the message', async () => {
    const big = new File([new Uint8Array(MAX_MODEL_BYTES + 1)], 'big.glb');
    expect(await checkLocalModel(big)).toEqual({
      ok: false,
      message: 'This file is 15.0 MB. The limit is 15 MB.',
    });
  });

  it('rejects a renamed non-GLB file', async () => {
    expect(await checkLocalModel(new File(['not a glb at all'], 'fake.glb'))).toMatchObject({
      ok: false,
    });
  });

  it('accepts a .gltf with embedded data', async () => {
    const r = await checkLocalModel(
      gltf({ buffers: [{ uri: 'data:application/octet-stream;base64,AAAA' }], images: [] }),
    );
    expect(r).toEqual({ ok: true });
  });

  it('rejects a .gltf that references external files', async () => {
    const r = await checkLocalModel(gltf({ buffers: [{ uri: 'model.bin' }] }));
    expect(r).toMatchObject({ ok: false, message: expect.stringMatching(/single \.glb/) });
  });

  it('rejects a .gltf that is not JSON', async () => {
    expect(await checkLocalModel(new File(['{oops'], 'a.gltf'))).toMatchObject({ ok: false });
  });
});
