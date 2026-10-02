/** Where the viewer fetches decoder files from. Must be same-origin (or CORS-enabled) URLs ending in `/`. */
export interface DecoderPaths {
  /** Directory containing three's `draco_decoder.js/.wasm` and `draco_wasm_wrapper.js`. */
  draco: string;
  /** Directory containing three's `basis_transcoder.js/.wasm` (for KTX2 textures). */
  basis: string;
}

export const DEFAULT_DECODER_PATHS: DecoderPaths = {
  draco: '/decoders/draco/',
  basis: '/decoders/basis/',
};

export interface LoadProgress {
  /** 0–1, or `null` when the server didn't report a size. */
  fraction: number | null;
  loadedBytes: number;
}

export interface ModelInfo {
  meshCount: number;
  triangleCount: number;
  animationNames: string[];
}

export type ViewerErrorKind = 'network' | 'parse' | 'unknown';

export interface ViewerError {
  kind: ViewerErrorKind;
  /** Safe to show to shoppers. */
  message: string;
  cause: unknown;
}
