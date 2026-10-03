import type { EnvironmentId } from './environments';

/**
 * Scene settings. Pure data and helpers with no three.js import, so apps can use them (via
 * `@twirl/viewer/settings`) without pulling the 3D engine into their initial JavaScript.
 *
 * Scene settings. In M2 these move into the Zod product-config schema in @twirl/config-schema;
 * until then they're plain types. Colors are CSS hex strings (#rrggbb).
 */
export type SceneBackground =
  | { type: 'solid'; color: string }
  | { type: 'gradient'; from: string; to: string }
  /** Soft studio backdrop: a lighter centre (behind the product) falling off to `outer`. */
  | { type: 'radial'; inner: string; outer: string };

export const LIGHTING_PRESETS = ['warm', 'studio', 'soft', 'outdoor', 'dramatic'] as const;
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
  /**
   * Surround the product with a 3D studio cove (floor curving into a wall) painted in the
   * backdrop's colours, instead of a flat CSS backdrop.
   */
  cyclorama: boolean;
}

const DEFAULT_BACKGROUND: SceneBackground = { type: 'radial', inner: '#fffaf3', outer: '#eadbc8' };

export const DEFAULT_SCENE: SceneSettings = {
  background: DEFAULT_BACKGROUND,
  lighting: 'warm',
  // Seamless studio look: the product sits on the backdrop with a soft contact shadow.
  floor: false,
  shadows: true,
  cyclorama: true,
};

/** The CSS `background` for the viewer container (the canvas itself is transparent). */
export function backgroundCss(background: SceneBackground): string {
  switch (background.type) {
    case 'solid':
      return background.color;
    case 'radial':
      return `radial-gradient(120% 95% at 50% 38%, ${background.inner} 0%, ${background.outer} 100%)`;
    case 'gradient':
      return `linear-gradient(180deg, ${background.from} 0%, ${background.to} 100%)`;
  }
}
