import { type DataTexture, Loader } from 'three';

import { decodeHdr, type DecodedHdr, hdrTexture } from './hdr-decode';
import type { HdrRequest, HdrResponse } from './hdr.worker';

type Pending = { resolve: (d: DecodedHdr) => void; reject: (e: Error) => void };

let worker: Worker | null | undefined; // undefined = not tried yet, null = unavailable
let nextId = 0;
const pending = new Map<number, Pending>();

function getWorker(): Worker | null {
  if (worker !== undefined) return worker;
  try {
    if (typeof Worker === 'undefined') throw new Error('Workers unavailable');
    worker = new Worker(new URL('./hdr.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }: MessageEvent<HdrResponse>) => {
      const job = pending.get(data.id);
      pending.delete(data.id);
      if (!job) return;
      if (data.ok) job.resolve(data.decoded);
      else job.reject(new Error(data.message));
    };
    worker.onerror = (event) => {
      // The worker itself failed (e.g. blocked by CSP): fail in-flight jobs and stop using it.
      for (const job of pending.values())
        job.reject(new Error(event.message || 'HDR worker failed'));
      pending.clear();
      worker?.terminate();
      worker = null;
    };
  } catch {
    worker = null;
  }
  return worker;
}

async function decodeOnMainThread(url: string): Promise<DecodedHdr> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`fetch for "${url}" responded with ${response.status}`);
  return decodeHdr(await response.arrayBuffer());
}

/** Decodes in the worker when possible, otherwise on the main thread. */
export function decodeHdrUrl(url: string): Promise<DecodedHdr> {
  const absolute = typeof document === 'undefined' ? url : new URL(url, document.baseURI).href;
  const w = getWorker();
  if (!w) return decodeOnMainThread(absolute);
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    w.postMessage({ id, url: absolute } satisfies HdrRequest);
  });
}

/**
 * A three.js loader (so R3F's useLoader caching and clear() work as usual) that fetches and
 * parses .hdr files in a Web Worker. The resulting texture carries `userData.sun`.
 */
export class HDRWorkerLoader extends Loader<DataTexture> {
  override load(
    url: string,
    onLoad: (texture: DataTexture) => void,
    _onProgress?: (event: ProgressEvent) => void,
    onError?: (error: unknown) => void,
  ) {
    const resolved = this.manager.resolveURL(this.path + url);
    this.manager.itemStart(resolved);
    decodeHdrUrl(resolved)
      .then((decoded) => {
        onLoad(hdrTexture(decoded));
        this.manager.itemEnd(resolved);
      })
      .catch((error: unknown) => {
        onError?.(error);
        this.manager.itemError(resolved);
        this.manager.itemEnd(resolved);
      });
  }
}
