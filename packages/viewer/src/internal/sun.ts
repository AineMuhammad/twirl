import { DataUtils } from 'three';

export interface EquirectImage {
  width: number;
  height: number;
  /** RGBA texels, row 0 = top of the panorama (as HDRLoader returns it). */
  data: ArrayLike<number>;
  /** True if `data` holds half floats (Uint16), as with HDRLoader's default HalfFloatType. */
  halfFloat: boolean;
}

export interface SunEstimate {
  /** Unit vector from the scene toward the brightest region above the horizon. */
  direction: [number, number, number];
  /**
   * Peak cell luminance divided by the mean: ~1–3 for overcast/diffuse light, 10+ for a clear sun
   * or a strong lamp. Used to decide how hard the key light (and its shadow) should be.
   */
  dominance: number;
}

/** Direction for normalized panorama coords (u: 0..1 left→right, v: 0..1 bottom→top), matching
 * three.js' equirectangular mapping (`equirectUv` in its shaders). */
export function equirectDirection(u: number, v: number): [number, number, number] {
  const lon = (u - 0.5) * 2 * Math.PI;
  const lat = (v - 0.5) * Math.PI;
  return [Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)];
}

/** Inverse of `equirectDirection`, as three.js computes it in shaders. */
export function equirectUv([x, y, z]: [number, number, number]): [number, number] {
  return [
    Math.atan2(z, x) / (2 * Math.PI) + 0.5,
    Math.asin(Math.max(-1, Math.min(1, y))) / Math.PI + 0.5,
  ];
}

const CELLS_X = 64;
const CELLS_Y = 32;
/** Ignore cells whose centre is less than ~3° above the horizon: shadows must fall downward. */
const MIN_ELEVATION = Math.sin((3 * Math.PI) / 180);

/**
 * Finds the dominant light in an HDR panorama by averaging luminance over a coarse grid (so a
 * single hot pixel can't win) and picking the brightest cell above the horizon.
 */
export function estimateSun(image: EquirectImage): SunEstimate {
  const { width, height, data, halfFloat } = image;
  const read = halfFloat
    ? (i: number) => DataUtils.fromHalfFloat(data[i] ?? 0)
    : (i: number) => data[i] ?? 0;
  const sums = new Float64Array(CELLS_X * CELLS_Y);
  const counts = new Uint32Array(CELLS_X * CELLS_Y);
  // Sampling every other texel is plenty for a 64×32 grid and halves the cost.
  const step = width >= 512 ? 2 : 1;

  for (let row = 0; row < height; row += step) {
    const cy = Math.min(CELLS_Y - 1, Math.floor((row / height) * CELLS_Y));
    for (let col = 0; col < width; col += step) {
      const cx = Math.min(CELLS_X - 1, Math.floor((col / width) * CELLS_X));
      const i = (row * width + col) * 4;
      const lum = 0.2126 * read(i) + 0.7152 * read(i + 1) + 0.0722 * read(i + 2);
      sums[cy * CELLS_X + cx] = (sums[cy * CELLS_X + cx] ?? 0) + lum;
      counts[cy * CELLS_X + cx] = (counts[cy * CELLS_X + cx] ?? 0) + 1;
    }
  }

  let best = -1;
  let bestLum = -Infinity;
  let total = 0;
  let cells = 0;
  for (let c = 0; c < sums.length; c++) {
    const n = counts[c] ?? 0;
    if (n === 0) continue;
    const mean = (sums[c] ?? 0) / n;
    total += mean;
    cells += 1;
    const cy = Math.floor(c / CELLS_X);
    const v = 1 - (cy + 0.5) / CELLS_Y; // row 0 is the top of the panorama
    if (equirectDirection(0.5, v)[1] < MIN_ELEVATION) continue;
    if (mean > bestLum) {
      bestLum = mean;
      best = c;
    }
  }

  if (best < 0 || cells === 0) return { direction: [0, 1, 0], dominance: 1 };
  const u = ((best % CELLS_X) + 0.5) / CELLS_X;
  const v = 1 - (Math.floor(best / CELLS_X) + 0.5) / CELLS_Y;
  const average = total / cells;
  return { direction: equirectDirection(u, v), dominance: average > 0 ? bestLum / average : 1 };
}
