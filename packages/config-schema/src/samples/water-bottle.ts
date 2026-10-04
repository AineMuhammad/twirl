import type { ProductConfigInput } from '../config';

/**
 * Demo product: an insulated water bottle with a grip sleeve (samples/water-bottle.glb, Khronos,
 * CC0). The source was one mesh; it was split into bottle, cap and sleeve. Prices in US cents.
 */
export const waterBottleConfig = {
  schemaVersion: 1,
  product: {
    name: 'Summit Insulated Bottle',
    description: 'Double-wall steel bottle, 750 ml, with a removable silicone grip sleeve.',
  },
  parts: [
    { id: 'bottle', label: 'Bottle', meshes: ['Bottle'] },
    { id: 'cap', label: 'Cap', meshes: ['Cap'] },
    { id: 'sleeve', label: 'Grip sleeve', meshes: ['Sleeve'] },
  ],
  groups: [
    {
      type: 'color',
      id: 'bottle',
      label: 'Bottle',
      parts: ['bottle'],
      default: null,
      originalLabel: 'Champagne gold',
      swatches: [
        { id: 'matte-black', label: 'Matte black', color: '#1e1e1e' },
        { id: 'arctic-white', label: 'Arctic white', color: '#eceeed' },
        { id: 'sage', label: 'Sage', color: '#8fa58a' },
        { id: 'ocean', label: 'Ocean', color: '#1f5f8b' },
        { id: 'coral', label: 'Coral', color: '#e0705a' },
      ],
      allowCustom: true,
      customPrice: 500,
    },
    {
      type: 'color',
      id: 'cap',
      label: 'Cap',
      parts: ['cap'],
      default: null,
      originalLabel: 'Maroon',
      swatches: [
        { id: 'black', label: 'Black', color: '#1b1b1b' },
        { id: 'white', label: 'White', color: '#efefef' },
        { id: 'bamboo', label: 'Bamboo', color: '#c9a46c', price: 500 },
      ],
    },
    {
      type: 'visibility',
      id: 'sleeve-on',
      label: 'Grip sleeve',
      description: 'Silicone sleeve that protects against dents.',
      parts: ['sleeve'],
      default: true,
      price: 900,
    },
    {
      type: 'color',
      id: 'sleeve',
      label: 'Sleeve colour',
      parts: ['sleeve'],
      default: null,
      originalLabel: 'Black',
      swatches: [
        { id: 'grey', label: 'Grey', color: '#6d6f71' },
        { id: 'olive', label: 'Olive', color: '#5b6146' },
        { id: 'coral', label: 'Coral', color: '#e0705a' },
      ],
    },
  ],
  pricing: { currency: 'USD', base: 3400 },
  rules: [
    {
      type: 'availability',
      id: 'sleeve-colour-needs-sleeve',
      when: { group: 'sleeve-on', equals: false },
      target: { group: 'sleeve' },
      effect: 'hide',
      message: 'Add the sleeve to choose its colour.',
    },
  ],
  scene: {
    background: { type: 'gradient', from: '#f3f7f6', to: '#d4e2de' },
    lighting: 'outdoor',
    floor: false,
    shadows: true,
    cyclorama: true,
  },
  presentation: { layout: 'bottomBar', theme: { accent: '#2f7a6b' } },
} satisfies ProductConfigInput;
