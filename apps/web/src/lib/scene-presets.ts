import type { SceneBackground } from '@twirl/viewer';

export const BACKGROUND_PRESETS: { name: string; background: SceneBackground }[] = [
  { name: 'Studio white', background: { type: 'gradient', from: '#ffffff', to: '#e9e9ec' } },
  { name: 'Warm', background: { type: 'gradient', from: '#fffaf3', to: '#eadfce' } },
  { name: 'Cool', background: { type: 'gradient', from: '#f7fafc', to: '#d9e2ec' } },
  { name: 'Light grey', background: { type: 'solid', color: '#f1f1f2' } },
  { name: 'Charcoal', background: { type: 'solid', color: '#26272b' } },
];

export const PROCEDURAL_LABELS = {
  studio: 'Studio',
  soft: 'Soft',
  outdoor: 'Outdoor',
  dramatic: 'Dramatic',
} as const;

export function sameBackground(a: SceneBackground, b: SceneBackground) {
  return JSON.stringify(a) === JSON.stringify(b);
}
