import type { ProductConfigInput } from '../config';

/**
 * Demo product: a glass-base table lamp with a drum shade (samples/glass-table-lamp.glb, Wayfair
 * via Khronos, CC BY 4.0). Prices in US cents.
 */
export const glassTableLampConfig = {
  schemaVersion: 1,
  product: {
    name: 'Lumen Glass Table Lamp',
    description: 'An iridescent glass globe base under a linen drum shade.',
  },
  parts: [
    { id: 'shade', label: 'Shade', meshes: ['Shade'] },
    { id: 'glass', label: 'Glass base', meshes: ['Glass_Base', 'Glass_Inner'] },
    { id: 'metal', label: 'Metal fittings', meshes: ['Metal'] },
  ],
  groups: [
    {
      type: 'visibility',
      id: 'shade-on',
      label: 'Shade',
      description: 'Remove it for a bare-bulb look.',
      parts: ['shade'],
      default: true,
    },
    {
      type: 'color',
      id: 'shade',
      label: 'Shade colour',
      parts: ['shade'],
      default: null,
      originalLabel: 'Taupe linen',
      swatches: [
        { id: 'ivory', label: 'Ivory', color: '#ece4d6' },
        { id: 'sage', label: 'Sage', color: '#93a18a' },
        { id: 'terracotta', label: 'Terracotta', color: '#b45f3c' },
        { id: 'black', label: 'Black', color: '#1b1b1b' },
      ],
    },
    {
      type: 'color',
      id: 'glass',
      label: 'Glass',
      parts: ['glass'],
      default: null,
      originalLabel: 'Iridescent clear',
      swatches: [
        { id: 'smoke', label: 'Smoke', color: '#555b60', price: 2000 },
        { id: 'amber', label: 'Amber', color: '#b9782f', price: 2000 },
      ],
    },
    {
      type: 'color',
      id: 'metal',
      label: 'Fittings',
      parts: ['metal'],
      default: null,
      originalLabel: 'Polished chrome',
      swatches: [
        { id: 'brass', label: 'Brass', color: '#b08d57', price: 3000 },
        { id: 'matte-black', label: 'Matte black', color: '#222222' },
      ],
    },
  ],
  pricing: { currency: 'USD', base: 22900 },
  rules: [
    {
      type: 'availability',
      id: 'shade-colour-needs-shade',
      when: { group: 'shade-on', equals: false },
      target: { group: 'shade' },
      effect: 'hide',
      message: 'Add the shade to choose its colour.',
    },
  ],
  scene: {
    background: { type: 'radial', inner: '#f9f7f4', outer: '#dfd8cf' },
    lighting: 'warm',
    floor: false,
    shadows: true,
    cyclorama: true,
  },
  presentation: { layout: 'sidebar', theme: { accent: '#4d6b73' } },
} satisfies ProductConfigInput;
