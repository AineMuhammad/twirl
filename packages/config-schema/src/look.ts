import { z } from 'zod';

import { hexColorSchema } from './primitives';

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

export const sceneBackgroundSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('solid'), color: hexColorSchema }),
  z.object({ type: z.literal('gradient'), from: hexColorSchema, to: hexColorSchema }),
  z.object({ type: z.literal('radial'), inner: hexColorSchema, outer: hexColorSchema }),
]);
export type SceneBackground = z.output<typeof sceneBackgroundSchema>;

/** A product's look: how it's lit and staged. */
export const sceneSchema = z.object({
  background: sceneBackgroundSchema,
  lighting: z.enum([...LIGHTING_PRESETS, ...ENVIRONMENT_IDS]),
  floor: z.boolean(),
  shadows: z.boolean(),
  cyclorama: z.boolean(),
});
export type SceneSettings = z.output<typeof sceneSchema>;

export const DEFAULT_SCENE: SceneSettings = {
  background: { type: 'radial', inner: '#fffaf3', outer: '#eadbc8' },
  lighting: 'warm',
  floor: false,
  shadows: true,
  cyclorama: true,
};
