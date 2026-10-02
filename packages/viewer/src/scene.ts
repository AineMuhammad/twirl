import { Color } from 'three';

import type { EnvironmentId } from './environments';

/**
 * Scene settings. In M2 these move into the Zod product-config schema in @twirl/config-schema;
 * until then they're plain types. Colors are CSS hex strings (#rrggbb).
 */
export type SceneBackground =
  | { type: 'solid'; color: string }
  | { type: 'gradient'; from: string; to: string }
  /**
   * Show the HDRI itself behind the product. Only applies when `lighting` is an environment;
   * otherwise the default gradient is used. `blur` 0–1 (0 = sharp). Blurring hides the low
   * resolution of a 1k panorama and reads like depth of field. `ground` projects the
   * panorama's floor under the model so it stands in the scene (blur doesn't apply then).
   */
  | { type: 'environment'; blur: number; ground?: boolean };

export const LIGHTING_PRESETS = ['studio', 'soft', 'outdoor', 'dramatic'] as const;
/** Procedural lighting built in-scene: instant, no download. */
export type LightingPreset = (typeof LIGHTING_PRESETS)[number];

export interface SceneSettings {
  background: SceneBackground;
  /** A procedural preset, or an HDRI environment id (downloads ~1.5 MB). */
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
    case 'environment':
      // Painted behind the canvas while the HDRI loads, or if it can't be shown.
      return backgroundCss(DEFAULT_BACKGROUND);
  }
}

/**
 * A floor color that reads as "ground" against the background: the bottom background color,
 * slightly darkened so the floor's soft edge is visible but not a hard disc.
 */
export function floorColorFor(background: SceneBackground): string {
  const base =
    background.type === 'solid'
      ? background.color
      : background.type === 'gradient'
        ? background.to
        : '#9a9a9a'; // neutral ground under a photographic environment
  const color = new Color(base);
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  // Darken light grounds a little; lighten very dark ones so the floor is still visible.
  const l = hsl.l > 0.15 ? hsl.l * 0.94 : hsl.l + 0.06;
  return `#${color.setHSL(hsl.h, hsl.s, Math.min(1, l)).getHexString()}`;
}
