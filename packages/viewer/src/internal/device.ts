/**
 * Device capability heuristics. Kept tiny and pure (inputs injected) so they're testable.
 */

export interface DeviceHints {
  /** True for touch-first devices (phones, tablets). */
  coarsePointer: boolean;
  devicePixelRatio: number;
}

/** Pixel-ratio ceilings. Phones render at most 1.5x to protect frame rate and battery. */
export const DPR_CAP_COARSE = 1.5;
export const DPR_CAP_FINE = 2;

export function readDeviceHints(
  win: Pick<Window, 'matchMedia' | 'devicePixelRatio'> | undefined,
): DeviceHints {
  if (!win) return { coarsePointer: false, devicePixelRatio: 1 };
  return {
    coarsePointer: win.matchMedia?.('(pointer: coarse)').matches ?? false,
    devicePixelRatio: win.devicePixelRatio || 1,
  };
}

/** The [min, max] DPR range for the canvas. */
export function dprRange(hints: DeviceHints): [number, number] {
  const cap = hints.coarsePointer ? DPR_CAP_COARSE : DPR_CAP_FINE;
  return [1, Math.max(1, Math.min(hints.devicePixelRatio, cap))];
}
