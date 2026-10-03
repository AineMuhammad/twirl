import type { BufferAttribute, Material, Mesh, MeshStandardMaterial, Texture } from 'three';
import { Color, SRGBColorSpace } from 'three';

/**
 * Recoloring textured materials.
 *
 * glTF shading multiplies `color × baseColorTexture`, so setting a color on a textured part
 * mostly reproduces the texture: a near-black region of a shared atlas (e.g. a metal frame) stays
 * near-black whatever color is picked. For overridden materials we keep the texture's light/dark
 * *detail* but not its hue or overall darkness: the texture's luminance is divided by its mean
 * luminance over the area this mesh actually uses, so the chosen color shows true on average.
 */

export interface PixelSource {
  width: number;
  height: number;
  /** RGBA, 8 bits per channel, row 0 = top of the image. */
  data: Uint8ClampedArray | Uint8Array;
}

const SAMPLE_SIZE = 256;
const MAX_UV_SAMPLES = 4000;
const pixelCache = new WeakMap<Texture, PixelSource | null>();

function srgbToLinear(c: number) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

/** Reads a texture's pixels (downscaled), from DataTexture data or by drawing the image. */
export function readPixels(texture: Texture): PixelSource | null {
  if (pixelCache.has(texture)) return pixelCache.get(texture) ?? null;
  let pixels: PixelSource | null = null;
  const image = texture.image as
    { width: number; height: number; data?: ArrayLike<number> } | CanvasImageSource | undefined;
  if (image && 'data' in image && image.data instanceof Uint8Array) {
    pixels = { width: image.width, height: image.height, data: image.data };
  } else if (image && typeof document !== 'undefined') {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = SAMPLE_SIZE;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(image as CanvasImageSource, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        pixels = { width: SAMPLE_SIZE, height: SAMPLE_SIZE, data };
      }
    } catch {
      pixels = null; // e.g. a cross-origin image without CORS
    }
  }
  pixelCache.set(texture, pixels);
  return pixels;
}

/**
 * Mean linear colour of `texture` over the texels `mesh` maps to (sampled at its vertex UVs,
 * including the texture's offset/repeat/rotation). Falls back to the whole image, then to grey.
 */
export function meanColorForMesh(
  mesh: Mesh,
  texture: Texture,
  pixels = readPixels(texture),
): Color {
  if (!pixels) return new Color(0.5, 0.5, 0.5);
  const toLinear = texture.colorSpace === SRGBColorSpace ? srgbToLinear : (c: number) => c / 255;
  const sum = [0, 0, 0];
  let count = 0;
  const add = (x: number, y: number) => {
    const i = (y * pixels.width + x) * 4;
    sum[0] = (sum[0] ?? 0) + toLinear(pixels.data[i] ?? 0);
    sum[1] = (sum[1] ?? 0) + toLinear(pixels.data[i + 1] ?? 0);
    sum[2] = (sum[2] ?? 0) + toLinear(pixels.data[i + 2] ?? 0);
    count += 1;
  };

  const uvName = texture.channel === 0 ? 'uv' : `uv${texture.channel}`;
  const uv = mesh.geometry.getAttribute(uvName) as BufferAttribute | undefined;
  if (uv && uv.count > 0) {
    texture.updateMatrix();
    const e = texture.matrix.elements;
    const step = Math.max(1, Math.floor(uv.count / MAX_UV_SAMPLES));
    for (let i = 0; i < uv.count; i += step) {
      const u0 = uv.getX(i);
      const v0 = uv.getY(i);
      // Same transform as three's shaders: uv' = matrix * (u, v, 1), then repeat-wrap.
      let u = (e[0] ?? 1) * u0 + (e[3] ?? 0) * v0 + (e[6] ?? 0);
      let v = (e[1] ?? 0) * u0 + (e[4] ?? 1) * v0 + (e[7] ?? 0);
      u -= Math.floor(u);
      v -= Math.floor(v);
      // glTF textures have flipY = false: v = 0 is the top row of the image.
      const y = texture.flipY ? 1 - v : v;
      add(
        Math.min(pixels.width - 1, Math.floor(u * pixels.width)),
        Math.min(pixels.height - 1, Math.floor(y * pixels.height)),
      );
    }
  } else {
    for (let y = 0; y < pixels.height; y += 4) for (let x = 0; x < pixels.width; x += 4) add(x, y);
  }
  if (count === 0) return new Color(0.5, 0.5, 0.5);
  return new Color((sum[0] ?? 0) / count, (sum[1] ?? 0) / count, (sum[2] ?? 0) / count);
}

const luminance = (c: Color) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;

/** Mean linear luminance of `texture` over the texels `mesh` maps to (see meanColorForMesh). */
export function meanLuminanceForMesh(mesh: Mesh, texture: Texture, pixels = readPixels(texture)) {
  return pixels ? luminance(meanColorForMesh(mesh, texture, pixels)) : 0.5;
}

/** Replaces three's map_fragment for tinted materials: texture detail without its hue. */
export const DETAIL_MAP_FRAGMENT = /* glsl */ `
#ifdef USE_MAP
  vec4 sampledDiffuseColor = texture2D( map, vMapUv );
  float twirlDetail = dot( sampledDiffuseColor.rgb, vec3( 0.2126, 0.7152, 0.0722 ) ) / max( twirlMapMean, 1e-4 );
  diffuseColor.rgb *= clamp( twirlDetail, 0.0, 2.0 );
  diffuseColor.a *= sampledDiffuseColor.a;
#endif
`;

const TINTED = Symbol('twirl-tinted');

/**
 * Prepares a (private, cloned) material on `mesh` for color overrides. Idempotent. Materials
 * without a `color` (e.g. normal or depth materials) are left alone.
 */
export function prepareForTint(material: Material, mesh: Mesh) {
  const m = material as MeshStandardMaterial & { [TINTED]?: true };
  if (!m.color?.isColor || m[TINTED]) return;
  m[TINTED] = true;
  // Vertex colors multiply the color too; a recolored part shouldn't keep them.
  if (m.vertexColors) {
    m.vertexColors = false;
    m.needsUpdate = true;
  }
  if (m.map) {
    const average = meanColorForMesh(mesh, m.map);
    const mean = { value: Math.max(luminance(average), 1e-4) };
    // Start from the texture's average colour, so a fade into the chosen colour begins from
    // what the part looked like rather than flashing grey.
    // (The detail term averages to 1 over the part, so `color = average` reproduces it.)
    m.color.multiply(average);
    m.onBeforeCompile = (shader) => {
      shader.uniforms.twirlMapMean = mean;
      shader.fragmentShader = `uniform float twirlMapMean;\n${shader.fragmentShader.replace(
        '#include <map_fragment>',
        DETAIL_MAP_FRAGMENT,
      )}`;
    };
    m.customProgramCacheKey = () => 'twirl-detail-map';
    m.needsUpdate = true;
  }
}
