import { describe, expect, it } from 'vitest';

import { isSameOrigin } from '../http';
import { assetKey, checkUploaded, modelTypeFor, safeFilename, uploadRequestSchema } from './upload';

describe('uploadRequestSchema', () => {
  it('accepts .glb/.gltf up to 15 MB and explains rejections', () => {
    expect(uploadRequestSchema.safeParse({ filename: 'Sofa.GLB', size: 1000 }).success).toBe(true);
    const tooBig = uploadRequestSchema.safeParse({ filename: 'a.glb', size: 16 * 1024 * 1024 });
    expect(tooBig.error?.issues[0]?.message).toBe('Models can be up to 15 MB.');
    const wrongType = uploadRequestSchema.safeParse({ filename: 'a.obj', size: 10 });
    expect(wrongType.error?.issues[0]?.message).toBe('Upload a .glb or .gltf file.');
    expect(uploadRequestSchema.safeParse({ filename: 'a.glb', size: 0 }).success).toBe(false);
  });
});

describe('keys and types', () => {
  it('builds safe, workspace-scoped keys', () => {
    expect(safeFilename('My Sofa (v2).GLB')).toBe('my-sofa-v2.glb');
    expect(safeFilename('Chaise Élégante.gltf')).toBe('chaise-elegante.gltf');
    expect(safeFilename('../../etc.glb')).toBe('etc.glb');
    expect(safeFilename('???.glb')).toBe('model.glb');
    expect(assetKey('ws1', 'a1', 'Sofa.glb')).toBe('workspaces/ws1/assets/a1/sofa.glb');
    expect(modelTypeFor('x.gltf')).toBe('model/gltf+json');
    expect(modelTypeFor('x.GLB')).toBe('model/gltf-binary');
  });
});

describe('checkUploaded', () => {
  const declared = { size: 100, mimeType: 'model/gltf-binary' };
  it('requires the stored object to match the declaration', () => {
    expect(checkUploaded(declared, { size: 100, contentType: 'model/gltf-binary' })).toEqual({
      ok: true,
    });
    expect(checkUploaded(declared, null).ok).toBe(false);
    expect(checkUploaded(declared, { size: 99, contentType: 'model/gltf-binary' }).ok).toBe(false);
    expect(checkUploaded(declared, { size: 100, contentType: 'text/html' }).ok).toBe(false);
  });
});

describe('isSameOrigin', () => {
  const req = (origin?: string) =>
    new Request('https://twirl.example/api/assets', {
      method: 'POST',
      headers: origin ? { origin } : {},
    });
  it('allows same-site and origin-less requests, blocks others', () => {
    expect(isSameOrigin(req('https://twirl.example'))).toBe(true);
    expect(isSameOrigin(req())).toBe(true);
    expect(isSameOrigin(req('https://evil.example'))).toBe(false);
    expect(isSameOrigin(req('null'))).toBe(false);
  });
});
