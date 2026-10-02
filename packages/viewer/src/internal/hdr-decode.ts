import {
  ClampToEdgeWrapping,
  DataTexture,
  EquirectangularReflectionMapping,
  HalfFloatType,
  LinearFilter,
  LinearSRGBColorSpace,
  RGBAFormat,
  type TextureDataType,
} from 'three';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';

import { estimateSun, type SunEstimate } from './sun';

/** A parsed HDR panorama plus its dominant light. Plain data, so it can cross a worker boundary. */
export interface DecodedHdr {
  width: number;
  height: number;
  data: Uint16Array | Float32Array;
  type: TextureDataType;
  sun: SunEstimate;
}

/** Parses an .hdr file (RGBE) into half floats and finds its dominant light. No DOM needed. */
export function decodeHdr(buffer: ArrayBuffer): DecodedHdr {
  const { width, height, data, type } = new HDRLoader().parse(buffer);
  if (!width || !height || !data || type === undefined) {
    throw new Error('THREE.HDRLoader: invalid or unsupported .hdr file');
  }
  const pixels = data as Uint16Array | Float32Array;
  const sun = estimateSun({ width, height, data: pixels, halfFloat: type === HalfFloatType });
  return { width, height, data: pixels, type, sun };
}

/** Builds the same texture HDRLoader would, ready to use as an environment map. */
export function hdrTexture(decoded: DecodedHdr): DataTexture {
  const texture = new DataTexture(
    decoded.data,
    decoded.width,
    decoded.height,
    RGBAFormat,
    decoded.type,
  );
  texture.mapping = EquirectangularReflectionMapping;
  texture.colorSpace = LinearSRGBColorSpace;
  texture.wrapS = ClampToEdgeWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.flipY = true;
  texture.userData.sun = decoded.sun;
  texture.needsUpdate = true;
  return texture;
}

export function sunOfTexture(texture: DataTexture): SunEstimate | undefined {
  return texture.userData.sun as SunEstimate | undefined;
}
