import type { WebGLRenderer } from 'three';
import type { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

import type { DecoderPaths } from '../types';

// Decoder loaders own Web Workers, so share one per path for the page's lifetime.
const dracoLoaders = new Map<string, DRACOLoader>();
const ktx2Loaders = new Map<string, KTX2Loader>();

function dracoLoaderFor(path: string) {
  let loader = dracoLoaders.get(path);
  if (!loader) {
    loader = new DRACOLoader().setDecoderPath(path);
    dracoLoaders.set(path, loader);
  }
  return loader;
}

function ktx2LoaderFor(path: string, renderer: WebGLRenderer) {
  let loader = ktx2Loaders.get(path);
  if (!loader) {
    loader = new KTX2Loader().setTranscoderPath(path).detectSupport(renderer);
    ktx2Loaders.set(path, loader);
  }
  return loader;
}

/**
 * Enables every compression extension we can decode: Draco and Meshopt geometry, KTX2 textures.
 * WebP textures need no decoder. Decoding is not optimization: models are rendered as uploaded.
 */
export function configureGltfLoader(
  loader: GLTFLoader,
  decoders: DecoderPaths,
  renderer: WebGLRenderer,
) {
  loader.setDRACOLoader(dracoLoaderFor(decoders.draco));
  loader.setKTX2Loader(ktx2LoaderFor(decoders.basis, renderer));
  loader.setMeshoptDecoder(MeshoptDecoder);
}
