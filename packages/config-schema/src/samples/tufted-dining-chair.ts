import type { ProductConfigInput } from '../config';

const buttons = Array.from({ length: 8 }, (_, i) => `Button-${String(i + 1).padStart(2, '0')}`);
const legs = ['Front-Left', 'Front-Right', 'Back-Left', 'Back-Right'].map((l) => `Leg-${l}`);

/**
 * Demo product: a leather dining chair with a button-tufted back (samples/tufted-dining-chair.glb,
 * "Dining Chair 02" by James Ray Cock on Poly Haven, CC0). The buttons are covered in the same
 * leather. Prices in US cents.
 */
export const tuftedDiningChairConfig = {
  schemaVersion: 1,
  product: {
    name: 'Ashby Tufted Dining Chair',
    description: 'A fully upholstered leather dining chair with a button-tufted back.',
  },
  parts: [
    { id: 'upholstery', label: 'Upholstery', meshes: ['Upholstery', ...buttons] },
    { id: 'legs', label: 'Legs', meshes: legs },
  ],
  groups: [
    {
      type: 'color',
      id: 'leather',
      label: 'Leather',
      parts: ['upholstery'],
      default: null,
      originalLabel: 'Chestnut',
      swatches: [
        { id: 'cognac', label: 'Cognac', color: '#8a4b25' },
        { id: 'black', label: 'Black', color: '#1c1a19' },
        { id: 'stone', label: 'Stone', color: '#b7aa98' },
        { id: 'forest', label: 'Forest green', color: '#2f4a3a', price: 4000 },
      ],
    },
    {
      type: 'color',
      id: 'legs',
      label: 'Legs',
      parts: ['legs'],
      default: null,
      originalLabel: 'Dark walnut',
      swatches: [
        { id: 'natural-oak', label: 'Natural oak', color: '#b48a5a' },
        { id: 'black', label: 'Black', color: '#1b1b1b' },
      ],
    },
  ],
  pricing: { currency: 'USD', base: 28900 },
  rules: [],
  scene: {
    background: { type: 'radial', inner: '#f7f3ee', outer: '#e2d9cc' },
    lighting: 'warm',
    floor: false,
    shadows: true,
    cyclorama: true,
  },
  presentation: { layout: 'sidebar', theme: { accent: '#2f4a3a', font: 'instrument-serif' } },
} satisfies ProductConfigInput;
