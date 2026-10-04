import type { ProductConfigInput } from '../config';

/**
 * Demo product: a porcelain teacup and saucer (samples/teacup-set.glb, Khronos, CC0). Glazes
 * keep the painted camellia pattern as light/dark detail. Prices in US cents.
 */
export const teacupConfig = {
  schemaVersion: 1,
  product: {
    name: 'Camellia Teacup & Saucer',
    description: 'Fine porcelain with a hand-painted camellia pattern and gilded rim.',
  },
  parts: [
    { id: 'cup', label: 'Cup', meshes: ['Cup'] },
    { id: 'saucer', label: 'Saucer', meshes: ['Saucer'] },
  ],
  groups: [
    {
      type: 'color',
      id: 'cup-glaze',
      label: 'Cup glaze',
      parts: ['cup'],
      default: null,
      originalLabel: 'Camellia white',
      swatches: [
        { id: 'celadon', label: 'Celadon', color: '#b5c9b0' },
        { id: 'blush', label: 'Blush', color: '#e8c4bd' },
        { id: 'cobalt', label: 'Cobalt', color: '#2d4f8f', price: 500 },
        { id: 'butter', label: 'Butter', color: '#efe0a8' },
      ],
    },
    {
      type: 'visibility',
      id: 'saucer-on',
      label: 'Matching saucer',
      parts: ['saucer'],
      default: true,
      price: 900,
    },
    {
      type: 'color',
      id: 'saucer-glaze',
      label: 'Saucer glaze',
      parts: ['saucer'],
      default: null,
      originalLabel: 'Camellia white',
      swatches: [
        { id: 'celadon', label: 'Celadon', color: '#b5c9b0' },
        { id: 'blush', label: 'Blush', color: '#e8c4bd' },
        { id: 'cobalt', label: 'Cobalt', color: '#2d4f8f', price: 500 },
        { id: 'butter', label: 'Butter', color: '#efe0a8' },
      ],
    },
  ],
  pricing: { currency: 'USD', base: 2900 },
  rules: [
    {
      type: 'availability',
      id: 'saucer-glaze-needs-saucer',
      when: { group: 'saucer-on', equals: false },
      target: { group: 'saucer-glaze' },
      effect: 'hide',
      message: 'Add the saucer to choose its glaze.',
    },
  ],
  scene: {
    background: { type: 'radial', inner: '#fffdf9', outer: '#ece4d8' },
    lighting: 'soft',
    floor: false,
    shadows: true,
    cyclorama: true,
  },
  presentation: { layout: 'sidebar', theme: { accent: '#9c6b4e', font: 'instrument-serif' } },
} satisfies ProductConfigInput;
