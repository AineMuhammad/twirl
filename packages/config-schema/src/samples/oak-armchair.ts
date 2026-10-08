import type { ProductConfigInput } from '../config';

/**
 * Demo product: a Scandinavian armchair, a solid-oak frame with loose cushions
 * (samples/oak-armchair.glb, "Modern Arm Chair 01" by Vibrant Nordic on Poly Haven, CC0). Prices
 * in US cents.
 */
export const oakArmchairConfig = {
  schemaVersion: 1,
  product: {
    name: 'Fjord Oak Armchair',
    description: 'A solid-oak armchair with deep, loose cushions in a soft bouclé.',
  },
  parts: [
    { id: 'cushions', label: 'Cushions', meshes: ['Seat_Cushion', 'Back_Cushion'] },
    {
      id: 'frame',
      label: 'Frame',
      meshes: ['Side_Frame-Left', 'Side_Frame-Right', 'Seat_Rail', 'Back_Rail', 'Front_Rail'],
    },
  ],
  groups: [
    {
      type: 'color',
      id: 'fabric',
      label: 'Cushion fabric',
      parts: ['cushions'],
      default: null,
      originalLabel: 'Charcoal bouclé',
      swatches: [
        { id: 'cream', label: 'Cream bouclé', color: '#e8e0d2' },
        { id: 'oat', label: 'Oat', color: '#cbbd9f' },
        { id: 'moss', label: 'Moss', color: '#6b7350' },
        { id: 'ocean', label: 'Ocean blue', color: '#34506b' },
        { id: 'terracotta', label: 'Terracotta', color: '#b5532f', price: 8000 },
      ],
      allowCustom: true,
      customPrice: 12000,
    },
    {
      type: 'color',
      id: 'frame',
      label: 'Frame',
      parts: ['frame'],
      default: null,
      originalLabel: 'Smoked oak',
      swatches: [
        { id: 'natural', label: 'Natural oak', color: '#b48a5a' },
        { id: 'white-oiled', label: 'White-oiled oak', color: '#d6c3a3' },
        { id: 'black', label: 'Black-stained oak', color: '#262321', price: 6000 },
      ],
    },
  ],
  pricing: { currency: 'USD', base: 89900 },
  rules: [],
  scene: {
    background: { type: 'radial', inner: '#f7f3ee', outer: '#e2d9cc' },
    lighting: 'warm',
    floor: false,
    shadows: true,
    cyclorama: true,
  },
  presentation: { layout: 'sidebar', theme: { accent: '#34506b' } },
} satisfies ProductConfigInput;
