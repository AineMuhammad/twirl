import { Color } from 'three';

/**
 * Scene settings. In M2 these move into the Zod product-config schema in @twirl/config-schema;
 * until then they're plain types. Colors are CSS hex strings (#rrggbb).
 */
export type SceneBackground =
  { type: 'solid'; color: string } | { type: 'gradient'; from: string; to: string };

export const LIGHTING_PRESETS = ['studio', 'soft', 'outdoor', 'dramatic'] as const;
export type LightingPreset = (typeof LIGHTING_PRESETS)[number];

export interface SceneSettings {
  background: SceneBackground;
  lighting: LightingPreset;
  floor: boolean;
  shadows: boolean;
}

export const DEFAULT_SCENE: SceneSettings = {
  background: { type: 'gradient', from: '#ffffff', to: '#e9e9ec' },
  lighting: 'studio',
  floor: true,
  shadows: true,
};

/** The CSS `background` for the viewer container (the canvas itself is transparent). */
export function backgroundCss(background: SceneBackground): string {
  return background.type === 'solid'
    ? background.color
    : `linear-gradient(180deg, ${background.from} 0%, ${background.to} 100%)`;
}

/**
 * A floor color that reads as "ground" against the background: the bottom background color,
 * slightly darkened so the floor's soft edge is visible but not a hard disc.
 */
export function floorColorFor(background: SceneBackground): string {
  const base = background.type === 'solid' ? background.color : background.to;
  const color = new Color(base);
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  // Darken light grounds a little; lighten very dark ones so the floor is still visible.
  const l = hsl.l > 0.15 ? hsl.l * 0.94 : hsl.l + 0.06;
  return `#${color.setHSL(hsl.h, hsl.s, Math.min(1, l)).getHexString()}`;
}
