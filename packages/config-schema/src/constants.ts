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

/**
 * Real materials a colour option can use: a fabric, leather or wood texture set (served by the
 * host app, see tools/materials), tinted with the option's colour as its dye or stain.
 */
export const MATERIALS = {
  velvet: { label: 'Velvet', kind: 'fabric' },
  linen: { label: 'Linen', kind: 'fabric' },
  boucle: { label: 'Bouclé', kind: 'fabric' },
  herringbone: { label: 'Wool herringbone', kind: 'fabric' },
  corduroy: { label: 'Corduroy', kind: 'fabric' },
  jacquard: { label: 'Jacquard', kind: 'fabric' },
  leather: { label: 'Smooth leather', kind: 'leather' },
  'grained-leather': { label: 'Grained leather', kind: 'leather' },
  oak: { label: 'Oak', kind: 'wood' },
  walnut: { label: 'Walnut', kind: 'wood' },
  teak: { label: 'Teak', kind: 'wood' },
  cherry: { label: 'Cherry', kind: 'wood' },
  sheesham: { label: 'Sheesham', kind: 'wood' },
} as const satisfies Record<string, { label: string; kind: 'fabric' | 'leather' | 'wood' }>;
export type MaterialId = keyof typeof MATERIALS;
export const MATERIAL_IDS = Object.keys(MATERIALS) as MaterialId[];

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
