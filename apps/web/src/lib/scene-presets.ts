import type { EnvironmentId, LightingPreset, SceneBackground } from '@twirl/viewer';

export const BACKGROUND_PRESETS: { name: string; background: SceneBackground }[] = [
  { name: 'Warm studio', background: { type: 'radial', inner: '#fffaf3', outer: '#eadbc8' } },
  { name: 'White studio', background: { type: 'radial', inner: '#ffffff', outer: '#e4e4e8' } },
  { name: 'Cool studio', background: { type: 'radial', inner: '#f8fbff', outer: '#d5dfec' } },
  { name: 'Sage', background: { type: 'radial', inner: '#f6f8f3', outer: '#d6dccd' } },
  { name: 'Charcoal', background: { type: 'radial', inner: '#3b3c41', outer: '#18191c' } },
];

export const PROCEDURAL_LABELS: Record<LightingPreset, string> = {
  warm: 'Warm',
  studio: 'Studio',
  soft: 'Soft',
  outdoor: 'Outdoor',
  dramatic: 'Dramatic',
};

/** Two-tone mood previews for the lighting cards (approximate colors of each light). */
export const LIGHTING_TONES: Record<LightingPreset | EnvironmentId, [string, string]> = {
  warm: ['#fff1dc', '#e0b98a'],
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
