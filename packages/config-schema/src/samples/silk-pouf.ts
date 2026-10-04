import type { ProductConfigInput } from '../config';

/**
 * Demo product: a pleated silk pouf (samples/silk-pouf.glb, Wayfair via Khronos, CC BY 4.0).
 * One part, recoloured and resized. Prices in US cents.
 */
export const silkPoufConfig = {
  schemaVersion: 1,
  product: {
    name: 'Lune Pleated Pouf',
    description: 'A low, hand-pleated pouf in shot silk. Choose a colour and diameter.',
  },
  parts: [{ id: 'pouf', label: 'Pouf', meshes: ['Pouf'] }],
  groups: [
    {
      type: 'color',
      id: 'silk',
      label: 'Silk',
      parts: ['pouf'],
      default: null,
      originalLabel: 'Plum shot silk',
      swatches: [
        { id: 'champagne', label: 'Champagne', color: '#d8c3a0' },
        { id: 'teal', label: 'Teal', color: '#1f6d6b' },
        { id: 'blush', label: 'Blush', color: '#e0a9a6' },
        { id: 'midnight', label: 'Midnight', color: '#22253a' },
        { id: 'mustard', label: 'Mustard', color: '#c99a2e' },
      ],
      allowCustom: true,
      customPrice: 2000,
    },
    {
      type: 'dimension',
      id: 'diameter',
      label: 'Diameter',
      unit: 'cm',
      min: 45,
      max: 80,
      step: 5,
      default: 60,
      nativeSize: 60,
      axes: ['x', 'z'],
      behaviors: [{ part: 'pouf', mode: 'stretch' }],
      pricePerStep: 2500,
    },
  ],
  pricing: { currency: 'USD', base: 34900 },
  scene: {
    background: { type: 'radial', inner: '#fdf7f5', outer: '#ead8d3' },
    lighting: 'soft',
    floor: false,
    shadows: true,
    cyclorama: true,
  },
  presentation: { layout: 'bottomBar', theme: { accent: '#8c3a5b' } },
} satisfies ProductConfigInput;
