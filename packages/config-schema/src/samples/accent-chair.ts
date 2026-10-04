import type { ProductConfigInput } from '../config';

/**
 * Demo product: a tufted accent chair (samples/accent-chair.glb, Wayfair via Khronos,
 * CC BY 4.0). Fabric, piping, wood and hardware are separate nodes. Prices in US cents.
 */
export const accentChairConfig = {
  schemaVersion: 1,
  product: {
    name: 'Ophelia Tufted Accent Chair',
    description: 'A button-tufted accent chair with contrast piping on a solid wood frame.',
  },
  parts: [
    {
      id: 'fabric',
      label: 'Seat and back fabric',
      meshes: ['Seat_Fabric', 'Back_Fabric', 'Seat_Buttons', 'Back_Buttons'],
    },
    { id: 'piping', label: 'Piping', meshes: ['Seat_Piping', 'Back_Piping'] },
    { id: 'frame', label: 'Wood frame', meshes: ['Legs', 'Seat_Panel', 'Back_Panel'] },
    { id: 'hardware', label: 'Leg hardware', meshes: ['Leg_Hardware'] },
  ],
  hiddenMeshes: ['Label'],
  groups: [
    {
      type: 'color',
      id: 'fabric',
      label: 'Fabric',
      parts: ['fabric'],
      default: null,
      originalLabel: 'Purple & gold damask',
      swatches: [
        { id: 'emerald', label: 'Emerald velvet', color: '#1f5a45', price: 4000 },
        { id: 'blush', label: 'Blush velvet', color: '#d9a9a1', price: 4000 },
        { id: 'oatmeal', label: 'Oatmeal linen', color: '#d6c9b3' },
        { id: 'navy', label: 'Navy linen', color: '#26324d' },
        { id: 'saffron', label: 'Saffron', color: '#c99a32' },
      ],
      allowCustom: true,
      customPrice: 6000,
    },
    {
      type: 'color',
      id: 'piping',
      label: 'Piping',
      parts: ['piping'],
      default: null,
      originalLabel: 'Matching',
      swatches: [
        { id: 'gold', label: 'Gold cord', color: '#c9a24a', price: 2500 },
        { id: 'black', label: 'Black', color: '#1c1c1c' },
        { id: 'ivory', label: 'Ivory', color: '#ece5d6' },
      ],
    },
    {
      type: 'color',
      id: 'wood',
      label: 'Wood finish',
      parts: ['frame'],
      default: null,
      originalLabel: 'Walnut',
      swatches: [
        { id: 'natural-oak', label: 'Natural oak', color: '#b8895a' },
        { id: 'white-oak', label: 'White oak', color: '#cfb48e' },
        { id: 'ebonized', label: 'Ebonized', color: '#2a2522', price: 3000 },
      ],
    },
    {
      type: 'color',
      id: 'hardware',
      label: 'Hardware',
      parts: ['hardware'],
      default: null,
      originalLabel: 'Brushed steel',
      swatches: [
        { id: 'brass', label: 'Brass', color: '#b08d57', price: 1500 },
        { id: 'black', label: 'Matte black', color: '#1f1f1f' },
      ],
    },
  ],
  pricing: { currency: 'USD', base: 64900 },
  rules: [
    {
      type: 'excludes',
      id: 'no-black-piping-on-ebonized',
      a: { group: 'piping', equals: 'black' },
      b: { group: 'wood', equals: 'ebonized' },
      message: "Black piping isn't offered with the ebonized frame.",
    },
  ],
  scene: {
    background: { type: 'radial', inner: '#fbf8f4', outer: '#e7ded3' },
    lighting: 'soft',
    floor: false,
    shadows: true,
    cyclorama: true,
  },
  presentation: { layout: 'sidebar', theme: { accent: '#6b3fa0', font: 'instrument-serif' } },
} satisfies ProductConfigInput;
