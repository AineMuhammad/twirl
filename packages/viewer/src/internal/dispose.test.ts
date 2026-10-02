import { BoxGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, Texture } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createDeferredDisposer, disposeObject3D } from './dispose';

function fakeBitmapTexture() {
  const texture = new Texture();
  const close = vi.fn();
  texture.source.data = { width: 1, height: 1, close };
  return { texture, close };
}

describe('disposeObject3D', () => {
  it('disposes every geometry, material and texture once, even when shared', () => {
    const geometry = new BoxGeometry();
    const map = new Texture();
    const material = new MeshStandardMaterial({ map, normalMap: map });
    const root = new Group();
    root.add(new Mesh(geometry, material), new Mesh(geometry, material));

    const spies = [geometry, material, map].map((o) => vi.spyOn(o, 'dispose'));
    expect(disposeObject3D(root)).toEqual({ geometries: 1, materials: 1, textures: 1 });
    for (const spy of spies) expect(spy).toHaveBeenCalledTimes(1);
  });

  it('handles multi-material meshes and nested children', () => {
    const a = new MeshBasicMaterial();
    const b = new MeshBasicMaterial();
    const child = new Group();
    child.add(new Mesh(new BoxGeometry(), [a, b]));
    const root = new Group();
    root.add(child);
    expect(disposeObject3D(root).materials).toBe(2);
  });

  it('closes decoded image bitmaps only when asked', () => {
    const kept = fakeBitmapTexture();
    disposeObject3D(new Mesh(new BoxGeometry(), new MeshBasicMaterial({ map: kept.texture })));
    expect(kept.close).not.toHaveBeenCalled();

    const freed = fakeBitmapTexture();
    disposeObject3D(new Mesh(new BoxGeometry(), new MeshBasicMaterial({ map: freed.texture })), {
      closeImageBitmaps: true,
    });
    expect(freed.close).toHaveBeenCalledTimes(1);
  });
});

describe('createDeferredDisposer', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('disposes after the current task', () => {
    const dispose = vi.fn();
    createDeferredDisposer(dispose).schedule();
    expect(dispose).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it('skips disposal when cancelled (StrictMode remount)', () => {
    const dispose = vi.fn();
    const disposer = createDeferredDisposer(dispose);
    disposer.schedule();
    disposer.cancel();
    vi.runAllTimers();
    expect(dispose).not.toHaveBeenCalled();
  });

  it('schedules at most once', () => {
    const dispose = vi.fn();
    const disposer = createDeferredDisposer(dispose);
    disposer.schedule();
    disposer.schedule();
    vi.runAllTimers();
    expect(dispose).toHaveBeenCalledTimes(1);
  });
});
