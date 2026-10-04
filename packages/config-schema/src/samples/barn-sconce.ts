import type { ProductConfigInput } from '../config';

/**
 * Demo product: a barn-style wall sconce (samples/barn-sconce.glb, Wayfair via Khronos,
 * CC BY 4.0). Metal and bulb glass recolour separately. Prices in US cents.
 */
export const barnSconceConfig = {
  schemaVersion: 1,
  product: {
    name: 'Harbor Barn Sconce',
    description: 'A spun-metal barn sconce with an exposed vintage filament bulb.',
  },
  parts: [
    { id: 'metal', label: 'Metal', meshes: ['Metal'] },
    { id: 'bulb-glass', label: 'Bulb glass', meshes: ['Bulb_Glass'] },
    { id: 'filament', label: 'Filament', meshes: ['Filament'] },
  ],
  groups: [
    {
      type: 'color',
      id: 'finish',
      label: 'Finish',
      parts: ['metal'],
      default: null,
      originalLabel: 'Antique copper',
      swatches: [
        { id: 'matte-black', label: 'Matte black', color: '#1e1e1e' },
        { id: 'brushed-brass', label: 'Brushed brass', color: '#b5935b', price: 2000 },
        { id: 'polished-nickel', label: 'Polished nickel', color: '#c3c4c2', price: 2000 },
        { id: 'coastal-blue', label: 'Coastal blue', color: '#2f5d7c' },
        { id: 'barn-red', label: 'Barn red', color: '#8c2b22' },
      ],
    },
    {
      type: 'color',
      id: 'bulb-glass',
      label: 'Bulb glass',
      parts: ['bulb-glass'],
      default: null,
      originalLabel: 'Clear',
      swatches: [
        { id: 'amber', label: 'Amber', color: '#c98a3a', price: 900 },
        { id: 'smoke', label: 'Smoke', color: '#5a5a5a', price: 900 },
      ],
    },
  ],
  pricing: { currency: 'USD', base: 18900 },
  rules: [
    {
      type: 'availability',
      id: 'nickel-no-amber',
      when: { group: 'finish', equals: 'polished-nickel' },
      target: { group: 'bulb-glass', options: ['amber'] },
      effect: 'disable',
      message: "Amber glass isn't paired with polished nickel.",
    },
  ],
  scene: {
    background: { type: 'radial', inner: '#f4f6f7', outer: '#d3dade' },
    lighting: 'studio',
    floor: false,
    shadows: true,
    cyclorama: true,
  },
  presentation: { layout: 'sidebar', theme: { accent: '#9a5a2c' } },
} satisfies ProductConfigInput;
