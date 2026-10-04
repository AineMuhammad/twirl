import type { ProductConfigInput } from '../config';

/**
 * Demo product: aviator sunglasses (samples/aviator-sunglasses.glb, Darmstadt Graphics Group via
 * Khronos, CC BY 4.0; the logo texture on the earhooks was removed). Prices in US cents.
 */
export const sunglassesConfig = {
  schemaVersion: 1,
  product: {
    name: 'Aero Aviator Sunglasses',
    description: 'Lightweight metal aviators with mirrored lenses and soft-touch earhooks.',
  },
  parts: [
    { id: 'frame', label: 'Frame', meshes: ['Frames', 'TempleLeft', 'TempleRight'] },
    { id: 'lenses', label: 'Lenses', meshes: ['LensesExterior'] },
    { id: 'earhooks', label: 'Earhooks', meshes: ['EarhookLeft', 'EarhookRight'] },
    { id: 'nosepads', label: 'Nose pads', meshes: ['Nosepads'] },
  ],
  groups: [
    {
      type: 'color',
      id: 'frame',
      label: 'Frame',
      parts: ['frame'],
      default: null,
      originalLabel: 'Silver',
      swatches: [
        { id: 'gold', label: 'Gold', color: '#c9a65a', price: 2000 },
        { id: 'rose-gold', label: 'Rose gold', color: '#c48f7a', price: 2000 },
        { id: 'gunmetal', label: 'Gunmetal', color: '#45474b' },
        { id: 'matte-black', label: 'Matte black', color: '#1d1d1d' },
      ],
    },
    {
      type: 'color',
      id: 'lenses',
      label: 'Lenses',
      parts: ['lenses'],
      default: null,
      originalLabel: 'Iridescent mirror',
      swatches: [
        { id: 'g15', label: 'G-15 green', color: '#3d4a35' },
        { id: 'brown-gradient', label: 'Brown gradient', color: '#5a3b25' },
        { id: 'blue-mirror', label: 'Blue mirror', color: '#1f5fa8', price: 2000 },
        { id: 'silver-mirror', label: 'Silver mirror', color: '#9aa3ad', price: 2000 },
      ],
    },
    {
      type: 'color',
      id: 'earhooks',
      label: 'Earhooks',
      parts: ['earhooks'],
      default: null,
      originalLabel: 'Black',
      swatches: [
        { id: 'tortoise', label: 'Tortoise', color: '#6b3e1f' },
        { id: 'white', label: 'White', color: '#eeeeee' },
      ],
    },
  ],
  pricing: { currency: 'USD', base: 15900 },
  rules: [
    {
      type: 'requires',
      id: 'silver-mirror-dark-frames',
      when: { group: 'lenses', equals: 'silver-mirror' },
      require: { group: 'frame', oneOf: ['original', 'gunmetal', 'matte-black'] },
      message: 'Silver mirror lenses come with silver, gunmetal or matte black frames.',
    },
  ],
  scene: {
    background: { type: 'radial', inner: '#fbfbfb', outer: '#dcdfe3' },
    lighting: 'studio',
    floor: false,
    shadows: true,
    cyclorama: true,
  },
  presentation: {
    layout: 'bottomBar',
    theme: { accent: '#7a4ea3' },
    camera: { initialView: 'front' },
  },
} satisfies ProductConfigInput;
