/**
 * Scene settings. The schema and constants live in @twirl/config-schema (the product config's
 * `scene`); this module re-exports them with no three.js or Zod import, so apps can use them
 * (via `@twirl/viewer/settings`) without pulling either into their initial JavaScript.
 */
import type { SceneBackground } from '@twirl/config-schema';

export type { LightingPreset, SceneBackground, SceneSettings } from '@twirl/config-schema';
export { DEFAULT_SCENE, LIGHTING_PRESETS } from '@twirl/config-schema/constants';

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
