import { z } from 'zod';

import { ENVIRONMENT_IDS, LIGHTING_PRESETS } from './constants';
import { hexColorSchema } from './primitives';

export {
  CAMERA_VIEWS,
  type CameraView,
  DEFAULT_SCENE,
  ENVIRONMENT_IDS,
  type EnvironmentId,
  LIGHTING_PRESETS,
  type LightingPreset,
} from './constants';

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
