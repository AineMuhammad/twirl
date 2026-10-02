import { Color } from 'three';

import type { EnvironmentId } from './environments';

/**
 * Scene settings. In M2 these move into the Zod product-config schema in @twirl/config-schema;
 * until then they're plain types. Colors are CSS hex strings (#rrggbb).
 */
export type SceneBackground =
  { type: 'solid'; color: string } | { type: 'gradient'; from: string; to: string };

export const LIGHTING_PRESETS = ['studio', 'soft', 'outdoor', 'dramatic'] as const;
/** Procedural lighting built in-scene: instant, no download. */
export type LightingPreset = (typeof LIGHTING_PRESETS)[number];

export interface SceneSettings {
  background: SceneBackground;
  /**
   * A procedural preset, or an HDRI environment id (downloads ~1.5 MB). HDRIs only light the
   * product (lighting and reflections); they're never shown as the background.
   */
  lighting: LightingPreset | EnvironmentId;
  floor: boolean;
  shadows: boolean;
}

const DEFAULT_BACKGROUND: SceneBackground = { type: 'gradient', from: '#ffffff', to: '#e9e9ec' };

export const DEFAULT_SCENE: SceneSettings = {
  background: DEFAULT_BACKGROUND,
  lighting: 'studio',
  floor: true,
  shadows: true,
};

/** The CSS `background` for the viewer container (the canvas itself is transparent). */
export function backgroundCss(background: SceneBackground): string {
  switch (background.type) {
    case 'solid':
      return background.color;
    case 'gradient':
      return `linear-gradient(180deg, ${background.from} 0%, ${background.to} 100%)`;
  }
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
