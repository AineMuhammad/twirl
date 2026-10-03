import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { EquirectangularReflectionMapping, HalfFloatType } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { decodeHdr, hdrTexture, sunOfTexture } from './hdr-decode';
import { HDRWorkerLoader } from './hdr-worker-loader';

const SAMPLE = resolve(
  import.meta.dirname,
  '../../../../apps/web/public/hdri/1k/venice_sunset_1k.hdr',
);
const bytes = () => {
  const b = readFileSync(SAMPLE);
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
};

describe('decodeHdr', () => {
  it('parses a real 1k HDRI to half floats and finds the low sunset sun', () => {
    const decoded = decodeHdr(bytes());
    expect([decoded.width, decoded.height]).toEqual([1024, 512]);
    expect(decoded.type).toBe(HalfFloatType);
    expect(decoded.data).toBeInstanceOf(Uint16Array);
    expect(decoded.sun.direction[1]).toBeGreaterThan(0); // above the horizon
    expect(decoded.sun.direction[1]).toBeLessThan(0.35); // but low: it's a sunset
  });
});

describe('hdrTexture', () => {
  it('builds an equirect, linear, flipped data texture carrying the sun', () => {
    const decoded = decodeHdr(bytes());
    const texture = hdrTexture(decoded);
    expect(texture.mapping).toBe(EquirectangularReflectionMapping);
    expect(texture.flipY).toBe(true);
    expect(texture.generateMipmaps).toBe(false);
    expect(texture.image.width).toBe(1024);
    expect(sunOfTexture(texture)).toEqual(decoded.sun);
  });
});

describe('HDRWorkerLoader', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('falls back to main-thread decoding where Workers are unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(bytes())),
    );
    const texture = await new HDRWorkerLoader().loadAsync('/hdri/1k/venice_sunset_1k.hdr');
    expect(texture.image.width).toBe(1024);
    expect(sunOfTexture(texture)).toBeDefined();
  });

  it('reports HTTP errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 404 })),
    );
    await expect(new HDRWorkerLoader().loadAsync('/missing.hdr')).rejects.toThrow(/404/);
  });
});

describe('HDRWorkerLoader worker failure', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('finishes in-flight jobs on the main thread when the worker script fails to load', async () => {
    vi.resetModules(); // fresh module state: the worker hasn't been created yet
    const created: string[] = [];
    class FailingWorker {
      onmessage: ((e: MessageEvent) => void) | null = null;
      onerror: ((e: ErrorEvent) => void) | null = null;
      constructor(url: URL | string) {
        created.push(String(url));
      }
      postMessage() {
        // Simulate the script being blocked (e.g. by a CSP) after the job was queued.
        setTimeout(() => this.onerror?.(new Event('error') as ErrorEvent), 0);
      }
      terminate() {}
    }
    vi.stubGlobal('Worker', FailingWorker);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(bytes())),
    );

    const { HDRWorkerLoader: Loader } = await import('./hdr-worker-loader');
    const texture = await new Loader().loadAsync(
      'https://cdn.example.com/hdri/venice_sunset_1k.hdr',
    );
    expect(created).toHaveLength(1);
    expect(texture.image.width).toBe(1024);

    // Later loads skip the broken worker entirely.
    await new Loader().loadAsync('https://cdn.example.com/hdri/venice_sunset_1k.hdr');
    expect(created).toHaveLength(1);
  });
});
