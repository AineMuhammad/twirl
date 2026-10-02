import { type DataTexture, EquirectangularReflectionMapping, HalfFloatType } from 'three';

import { type EquirectImage, estimateSun, type SunEstimate } from './sun';

/** Marks a loaded HDR panorama for use as an environment map. */
export function prepareEquirect(texture: DataTexture): DataTexture {
  texture.mapping = EquirectangularReflectionMapping;
  return texture;
}

export function sunOf(texture: DataTexture): SunEstimate {
  const image = texture.image as { width: number; height: number; data: ArrayLike<number> };
  const equirect: EquirectImage = {
    width: image.width,
    height: image.height,
    data: image.data,
    halfFloat: texture.type === HalfFloatType,
  };
  return estimateSun(equirect);
}

/**
 * Key light strength from how dominant the brightest region is: a clear sun or strong lamp gets
 * a strong light (crisp shadow), overcast or diffuse light a weak one (faint shadow).
 */
export function keyIntensityFor(dominance: number): number {
  const t = Math.min(1, Math.max(0, (dominance - 2) / 18));
  return 0.25 + t * 2.25;
}
