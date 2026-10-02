import { Color } from 'three';

import type { SceneBackground } from '../scene';

/**
 * A floor color that reads as "ground" against the background: the bottom background color,
 * slightly darkened so the floor's soft edge is visible but not a hard disc.
 */
export function floorColorFor(background: SceneBackground): string {
  const base =
    background.type === 'solid'
      ? background.color
      : background.type === 'radial'
        ? background.outer
        : background.to;
  const color = new Color(base);
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  // Darken light grounds a little; lighten very dark ones so the floor is still visible.
  const l = hsl.l > 0.15 ? hsl.l * 0.94 : hsl.l + 0.06;
  return `#${color.setHSL(hsl.h, hsl.s, Math.min(1, l)).getHexString()}`;
}
