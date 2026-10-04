import type { ProductConfigInput } from '../config';

/**
 * Demo product: an arched table lamp with a tulip glass shade (samples/tulip-lamp.glb,
 * Darmstadt Graphics Group via Khronos, CC BY 4.0). Prices in US cents.
 */
export const tulipLampConfig = {
  schemaVersion: 1,
  product: {
    name: 'Tulip Arc Lamp',
    description: 'A sculpted cast-metal arc holding a frosted tulip glass shade.',
  },
  parts: [
    { id: 'stand', label: 'Stand', meshes: ['Stand'] },
    { id: 'shade', label: 'Shade', meshes: ['Shade'] },
  ],
  groups: [
    {
      type: 'color',
      id: 'stand-finish',
      label: 'Stand finish',
      parts: ['stand'],
      default: null,
      originalLabel: 'Oil-rubbed bronze',
      swatches: [
        { id: 'antique-brass', label: 'Antique brass', color: '#a7864f' },
        { id: 'matte-black', label: 'Matte black', color: '#1c1c1c' },
        { id: 'verdigris', label: 'Verdigris', color: '#4f7c6b', price: 2500 },
      ],
    },
    {
      type: 'color',
      id: 'shade-glass',
      label: 'Shade glass',
      parts: ['shade'],
      default: null,
      originalLabel: 'Frosted blush',
      swatches: [
        { id: 'frosted-white', label: 'Frosted white', color: '#efeee9' },
        { id: 'amber', label: 'Amber', color: '#c88a46', price: 1500 },
        { id: 'opal-green', label: 'Opal green', color: '#9fbfaa', price: 1500 },
      ],
    },
  ],
  pricing: { currency: 'USD', base: 15900 },
  scene: {
    background: { type: 'gradient', from: '#f6f1ea', to: '#e3d6c6' },
    lighting: 'dramatic',
    floor: false,
    shadows: true,
    cyclorama: true,
  },
  presentation: { layout: 'sidebar', theme: { accent: '#5b4a34', font: 'instrument-serif' } },
} satisfies ProductConfigInput;
