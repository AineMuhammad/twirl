/**
 * Fetches and decodes HDR panoramas off the main thread (parsing a 2k file takes ~170 ms).
 * The pixel buffer is transferred back, not copied.
 */
import { decodeHdr, type DecodedHdr } from './hdr-decode';

export interface HdrRequest {
  id: number;
  /** Absolute URL (relative URLs would resolve against the worker script). */
  url: string;
}

export type HdrResponse =
  { id: number; ok: true; decoded: DecodedHdr } | { id: number; ok: false; message: string };

// Typed locally: the package's tsconfig uses the DOM lib, not WebWorker.
interface WorkerScope {
  onmessage: ((event: MessageEvent<HdrRequest>) => void) | null;
  postMessage(message: HdrResponse, transfer?: Transferable[]): void;
}
const scope = self as unknown as WorkerScope;

scope.onmessage = async ({ data: { id, url } }) => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`fetch for "${url}" responded with ${response.status}`);
    const decoded = decodeHdr(await response.arrayBuffer());
    scope.postMessage({ id, ok: true, decoded }, [decoded.data.buffer]);
  } catch (error) {
    scope.postMessage({
      id,
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
