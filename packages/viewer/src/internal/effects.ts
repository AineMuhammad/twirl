export type EffectsSetting = 'auto' | 'on' | 'off';

/**
 * Whether to run post-processing. 'auto' enables it on mouse/trackpad devices while adaptive
 * quality is high, and turns it off when the frame rate drops.
 */
export function effectsEnabled(
  setting: EffectsSetting,
  coarsePointer: boolean,
  qualityFactor: number,
) {
  if (setting === 'on') return true;
  if (setting === 'off') return false;
  return !coarsePointer && qualityFactor >= 0.5;
}
