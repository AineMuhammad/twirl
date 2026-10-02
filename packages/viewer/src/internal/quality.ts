/**
 * Maps the adaptive quality factor (0–1) to render settings.
 * Shadow maps are powers of two; phones start one step lower than desktops.
 */
export function qualitySettings(factor: number, coarsePointer: boolean, maxDpr: number) {
  const f = Math.min(1, Math.max(0, factor));
  const dpr = Math.round((1 + (maxDpr - 1) * f) * 100) / 100;
  const best = coarsePointer ? 1024 : 2048;
  const shadowMapSize = f >= 0.5 ? best : best / 2;
  return { dpr, shadowMapSize };
}
