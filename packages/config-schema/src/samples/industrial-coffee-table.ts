import type { ProductConfigInput } from '../config';

const sides = ['Left', 'Right'];
const ends = ['Front', 'Back'];
const levels = ['Lower', 'Upper'];
const depthRails = levels.flatMap((l) => sides.map((s) => `Depth_Rail-${l}-${s}`));
const widthRails = levels.flatMap((l) => ends.map((e) => `Width_Rail-${l}-${e}`));
const legs = ends.flatMap((e) => sides.map((s) => `Leg-${e}-${s}`));
const bolts = Array.from({ length: 16 }, (_, i) => `Bolt-${String(i + 1).padStart(2, '0')}`);

/**
 * Demo product: a plank-top table on a welded steel frame (samples/industrial-coffee-table.glb,
 * "Industrial Coffee Table" by Ulan Cabanilla on Poly Haven, CC0). The length slider stretches
 * the top and the rails that run along it; legs, end rails and bolts move with the ends instead.
 * Prices in US cents.
 */
export const industrialCoffeeTableConfig = {
  schemaVersion: 1,
  product: {
    name: 'Foundry Coffee Table',
    description: 'Reclaimed-pine planks on a welded steel frame, made to length.',
  },
  parts: [
    { id: 'top', label: 'Top', meshes: ['Plank-Left', 'Plank-Centre', 'Plank-Right'] },
    { id: 'long-rails', label: 'Long rails', meshes: widthRails },
    { id: 'frame', label: 'Legs and end rails', meshes: [...legs, ...depthRails] },
    { id: 'bolts', label: 'Bolts', meshes: bolts },
  ],
  groups: [
    {
      type: 'color',
      id: 'top',
      label: 'Top',
      parts: ['top'],
      default: null,
      originalLabel: 'Reclaimed pine',
      swatches: [
        { id: 'walnut', label: 'Walnut', color: '#5c3a22' },
        { id: 'natural-oak', label: 'Natural oak', color: '#b48a5a' },
        { id: 'smoked', label: 'Smoked oak', color: '#4a3a2c' },
      ],
    },
    {
      type: 'color',
      id: 'frame',
      label: 'Frame',
      parts: ['long-rails', 'frame', 'bolts'],
      default: null,
      originalLabel: 'Raw steel',
      swatches: [
        { id: 'black', label: 'Matte black', color: '#1b1b1b' },
        { id: 'brass', label: 'Brushed brass', color: '#b08d57', price: 12000 },
      ],
    },
    {
      type: 'dimension',
      id: 'length',
      label: 'Length',
      unit: 'cm',
      min: 78,
      max: 118,
      step: 10,
      default: 78,
      nativeSize: 78,
      axes: ['x'],
      behaviors: [
        { part: 'top', mode: 'stretch' },
        { part: 'long-rails', mode: 'stretch' },
        { part: 'frame', mode: 'anchor' },
        { part: 'bolts', mode: 'anchor' },
      ],
      pricePerStep: 5000,
    },
  ],
  pricing: { currency: 'USD', base: 54900 },
  rules: [],
  scene: {
    background: { type: 'radial', inner: '#f7f3ee', outer: '#e2d9cc' },
    lighting: 'warm',
    floor: false,
    shadows: true,
    cyclorama: true,
  },
  presentation: { layout: 'sidebar', theme: { accent: '#3a3b3d' } },
} satisfies ProductConfigInput;
