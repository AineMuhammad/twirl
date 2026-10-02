import type { EnvironmentId, LightingPreset, SceneBackground } from '@twirl/viewer';

export const BACKGROUND_PRESETS: { name: string; background: SceneBackground }[] = [
  { name: 'Studio white', background: { type: 'gradient', from: '#ffffff', to: '#e9e9ec' } },
  { name: 'Warm', background: { type: 'gradient', from: '#fffaf3', to: '#eadfce' } },
  { name: 'Cool', background: { type: 'gradient', from: '#f7fafc', to: '#d9e2ec' } },
  { name: 'Light grey', background: { type: 'solid', color: '#f1f1f2' } },
  { name: 'Charcoal', background: { type: 'solid', color: '#26272b' } },
];

export const PROCEDURAL_LABELS: Record<LightingPreset, string> = {
  studio: 'Studio',
  soft: 'Soft',
  outdoor: 'Outdoor',
  dramatic: 'Dramatic',
};

/** Two-tone mood previews for the lighting cards (approximate colors of each light). */
export const LIGHTING_TONES: Record<LightingPreset | EnvironmentId, [string, string]> = {
  studio: ['#ffffff', '#d4d4d8'],
  soft: ['#fafafa', '#e7e5e4'],
  outdoor: ['#dbeafe', '#a7c4a0'],
  dramatic: ['#52525b', '#09090b'],
  studio_small_08: ['#f4f4f5', '#a1a1aa'],
  photo_studio_loft_hall: ['#fef3c7', '#d6d3d1'],
  lythwood_room: ['#fde68a', '#a8a29e'],
  empty_warehouse_01: ['#e7e5e4', '#57534e'],
  autoshop_01: ['#e0f2fe', '#475569'],
  potsdamer_platz: ['#e2e8f0', '#64748b'],
  kloofendal_48d_partly_cloudy_puresky: ['#bfdbfe', '#60a5fa'],
  venice_sunset: ['#fdba74', '#7c2d12'],
};

export function sameBackground(a: SceneBackground, b: SceneBackground) {
  return JSON.stringify(a) === JSON.stringify(b);
}
