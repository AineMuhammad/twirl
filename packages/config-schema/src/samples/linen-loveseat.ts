import type { ProductConfigInput } from '../config';

const legs = [
  'Front-Left',
  'Front-Centre',
  'Front-Right',
  'Back-Left',
  'Back-Centre',
  'Back-Right',
];

/**
 * Demo product: a linen loveseat on an exposed wooden frame (samples/linen-loveseat.glb, "Sofa
 * 01" by Kirill Sannikov on Poly Haven, CC0). Each leg is its own node, so the width slider moves
 * the outer legs instead of stretching them. Prices in US cents.
 */
export const linenLoveseatConfig = {
  schemaVersion: 1,
  product: {
    name: 'Hollis Linen Loveseat',
    description: 'A compact two-seater in washed linen, framed in solid wood.',
  },
  parts: [
    { id: 'upholstery', label: 'Upholstery', meshes: ['Upholstery'] },
    { id: 'seat-cushion', label: 'Seat cushion', meshes: ['Seat_Cushion'] },
    { id: 'frame', label: 'Wooden frame', meshes: ['Frame'] },
    { id: 'legs', label: 'Legs', meshes: legs.map((l) => `Leg-${l}`) },
  ],
  groups: [
    {
      type: 'color',
      id: 'fabric',
      label: 'Fabric',
      parts: ['upholstery', 'seat-cushion'],
      default: null,
      originalLabel: 'Pebble linen',
      swatches: [
        { id: 'oat', label: 'Oat linen', color: '#d8ccb6' },
        { id: 'sage', label: 'Sage linen', color: '#8fa58a' },
        { id: 'slate', label: 'Slate blue', color: '#4f6178' },
        { id: 'charcoal', label: 'Charcoal', color: '#3a3b3d' },
        { id: 'rust', label: 'Rust velvet', color: '#9c4a2a', price: 15000 },
      ],
      allowCustom: true,
      customPrice: 20000,
    },
    {
      type: 'color',
      id: 'wood',
      label: 'Wood finish',
      parts: ['frame', 'legs'],
      default: null,
      originalLabel: 'Espresso',
      swatches: [
        { id: 'walnut', label: 'Walnut', color: '#6b4428' },
        { id: 'natural-oak', label: 'Natural oak', color: '#b48a5a' },
        { id: 'white-oak', label: 'White oak', color: '#cdb48e', price: 9000 },
      ],
    },
    {
      type: 'dimension',
      id: 'width',
      label: 'Width',
      unit: 'cm',
      min: 147,
      max: 177,
      step: 10,
      default: 157,
      nativeSize: 157,
      axes: ['x'],
      behaviors: [
        { part: 'upholstery', mode: 'stretch' },
        { part: 'seat-cushion', mode: 'stretch' },
        { part: 'frame', mode: 'stretch' },
        { part: 'legs', mode: 'anchor' },
      ],
      pricePerStep: 12000,
    },
  ],
  pricing: { currency: 'USD', base: 129000 },
  rules: [],
  scene: {
    background: { type: 'radial', inner: '#f7f3ee', outer: '#e2d9cc' },
    lighting: 'warm',
    floor: false,
    shadows: true,
    cyclorama: true,
  },
  presentation: { layout: 'sidebar', theme: { accent: '#4f6178' } },
} satisfies ProductConfigInput;
