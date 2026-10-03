/**
 * Zod-free constants (`@twirl/config-schema/constants`), safe to import from code that renders
 * before the 3D viewer loads without pulling Zod into the page's initial JavaScript.
 */
import type { SceneSettings } from './look';

/** Procedural lighting presets (instant, built in-scene). */
export const LIGHTING_PRESETS = ['warm', 'studio', 'soft', 'outdoor', 'dramatic'] as const;
export type LightingPreset = (typeof LIGHTING_PRESETS)[number];

/** HDRI environments available as lighting (files are served by the host app). */
export const ENVIRONMENT_IDS = [
  'studio_small_08',
  'photo_studio_loft_hall',
  'lythwood_room',
  'empty_warehouse_01',
  'autoshop_01',
  'potsdamer_platz',
  'kloofendal_48d_partly_cloudy_puresky',
  'venice_sunset',
] as const;
export type EnvironmentId = (typeof ENVIRONMENT_IDS)[number];

/** Preset camera views available on every model. */
export const CAMERA_VIEWS = ['front', 'threeQuarter', 'side', 'back', 'top'] as const;
export type CameraView = (typeof CAMERA_VIEWS)[number];

export const DEFAULT_SCENE: SceneSettings = {
  background: { type: 'radial', inner: '#fffaf3', outer: '#eadbc8' },
  lighting: 'warm',
  floor: false,
  shadows: true,
  cyclorama: true,
};
