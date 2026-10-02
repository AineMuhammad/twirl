import type { LightingPreset } from '../scene';

type Vec3 = [number, number, number];

/** An emissive panel baked into the environment map (reflections + soft image-based light). */
export interface PanelLight {
  form: 'rect' | 'circle' | 'ring';
  color: string;
  intensity: number;
  /** Position as multiples of the environment's unit radius. */
  position: Vec3;
  scale: Vec3;
}

export interface LightingRig {
  /** Overall image-based lighting strength. */
  environmentIntensity: number;
  /** Base color of the environment "room" (what reflections see between panels). */
  environmentColor: string;
  panels: PanelLight[];
  /** Directional key light; also the shadow caster. Direction is from the target toward the light. */
  key: { color: string; intensity: number; direction: Vec3 };
  hemisphere: { sky: string; ground: string; intensity: number };
}

/**
 * Lighting presets built entirely in-scene (no HDRI downloads), so embeds make no third-party
 * requests and load fast on mobile.
 */
export const LIGHTING_RIGS: Record<LightingPreset, LightingRig> = {
  studio: {
    environmentIntensity: 0.55,
    environmentColor: '#2a2a2a',
    panels: [
      { form: 'rect', color: '#ffffff', intensity: 4, position: [-1, 1.2, 1.5], scale: [3, 2, 1] },
      { form: 'rect', color: '#ffffff', intensity: 2, position: [2, 0.8, 1], scale: [2, 2, 1] },
      { form: 'rect', color: '#ffffff', intensity: 1.5, position: [0, 1, -2], scale: [4, 1, 1] },
      { form: 'circle', color: '#ffffff', intensity: 2, position: [0, 3, 0], scale: [3, 3, 1] },
    ],
    key: { color: '#ffffff', intensity: 1.2, direction: [-0.6, 1.4, 1] },
    hemisphere: { sky: '#ffffff', ground: '#b5b5b5', intensity: 0.15 },
  },
  soft: {
    environmentIntensity: 0.6,
    environmentColor: '#6b6b6b',
    panels: [
      { form: 'circle', color: '#ffffff', intensity: 3, position: [0, 3, 0], scale: [6, 6, 1] },
      { form: 'rect', color: '#fffaf2', intensity: 1, position: [0, 0.8, 2.5], scale: [6, 2, 1] },
      { form: 'rect', color: '#f2f6ff', intensity: 1, position: [0, 0.8, -2.5], scale: [6, 2, 1] },
    ],
    key: { color: '#ffffff', intensity: 0.6, direction: [0.2, 2, 0.6] },
    hemisphere: { sky: '#ffffff', ground: '#d9d9d9', intensity: 0.35 },
  },
  outdoor: {
    environmentIntensity: 0.6,
    environmentColor: '#a9c7e8',
    panels: [
      {
        form: 'circle',
        color: '#fff4e0',
        intensity: 12,
        position: [2, 3, 1.5],
        scale: [0.8, 0.8, 1],
      },
      { form: 'rect', color: '#cfe3ff', intensity: 1.5, position: [0, 3, 0], scale: [8, 8, 1] },
      { form: 'rect', color: '#8a7d6b', intensity: 0.6, position: [0, -2, 0], scale: [8, 8, 1] },
    ],
    key: { color: '#fff1d6', intensity: 2, direction: [1.2, 2, 1] },
    hemisphere: { sky: '#cfe3ff', ground: '#8a7d6b', intensity: 0.3 },
  },
  dramatic: {
    environmentIntensity: 0.6,
    environmentColor: '#050505',
    panels: [
      { form: 'rect', color: '#ffffff', intensity: 6, position: [-2.5, 1, 0.5], scale: [1, 3, 1] },
      { form: 'ring', color: '#ffffff', intensity: 1, position: [2, 1.5, -2], scale: [1, 1, 1] },
    ],
    key: { color: '#ffffff', intensity: 2.6, direction: [-1.5, 1, 0.4] },
    hemisphere: { sky: '#ffffff', ground: '#000000', intensity: 0.08 },
  },
};
