import { describe, expect, it } from 'vitest';

import { progressFromEvent, toViewerError } from './errors';

describe('toViewerError', () => {
  it.each([
    ['Failed to fetch', 'network'],
    ['fetch for "x.glb" responded with 404: Not Found', 'network'],
    ['THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported.', 'parse'],
    ['Unexpected token < in JSON at position 0', 'parse'],
    ['THREE.GLTFLoader: No DRACOLoader instance provided.', 'parse'],
    ['out of cheese', 'unknown'],
  ])('classifies %j as %s', (message, kind) => {
    const error = toViewerError(new Error(message));
    expect(error.kind).toBe(kind);
    expect(error.message).not.toContain(message);
  });

  it('keeps the original error as the cause', () => {
    const cause = new Error('boom');
    expect(toViewerError(cause).cause).toBe(cause);
  });

  it('handles non-Error throws', () => {
    expect(toViewerError('Failed to fetch').kind).toBe('network');
  });
});

describe('progressFromEvent', () => {
  it('computes a fraction when the size is known', () => {
    expect(progressFromEvent({ lengthComputable: true, loaded: 25, total: 100 })).toEqual({
      fraction: 0.25,
      loadedBytes: 25,
    });
  });

  it('returns null fraction when the size is unknown', () => {
    expect(
      progressFromEvent({ lengthComputable: false, loaded: 25, total: 0 }).fraction,
    ).toBeNull();
  });

  it('clamps at 1', () => {
    expect(progressFromEvent({ lengthComputable: true, loaded: 120, total: 100 }).fraction).toBe(1);
  });
});
