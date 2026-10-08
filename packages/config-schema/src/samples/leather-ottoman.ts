import type { ProductConfigInput } from '../config';

const feet = ['Front-Left', 'Front-Right', 'Back-Left', 'Back-Right'].map((f) => `Foot-${f}`);

/**
 * Demo product: a stitched leather ottoman (samples/leather-ottoman.glb, "Ottoman 01" by Caspian
 * Fortune on Poly Haven, CC0). The feet are separate nodes, so the width slider moves them
 * instead of stretching them. Prices in US cents.
 */
export const leatherOttomanConfig = {
  schemaVersion: 1,
  product: {
    name: 'Brenner Leather Ottoman',
    description: 'A stitched, top-grain leather ottoman with a cushioned top on short feet.',
  },
  parts: [
    { id: 'body', label: 'Body', meshes: ['Body'] },
    { id: 'top', label: 'Top cushion', meshes: ['Top_Cushion'] },
    { id: 'feet', label: 'Feet', meshes: feet },
  ],
  groups: [
    {
      type: 'color',
      id: 'leather',
      label: 'Leather',
      parts: ['body', 'top'],
      default: null,
      originalLabel: 'Espresso',
      swatches: [
        { id: 'cognac', label: 'Cognac', color: '#8a4b25' },
        { id: 'tan', label: 'Saddle tan', color: '#a87443' },
        { id: 'black', label: 'Black', color: '#1c1a19' },
        { id: 'chalk', label: 'Chalk', color: '#e3dbcd', price: 6000 },
        { id: 'oxblood', label: 'Oxblood', color: '#4e1a17', price: 6000 },
      ],
    },
    {
      type: 'color',
      id: 'feet',
      label: 'Feet',
      parts: ['feet'],
      default: null,
      originalLabel: 'Matte black',
      swatches: [
        { id: 'walnut', label: 'Walnut', color: '#6b4428' },
        { id: 'brass', label: 'Brushed brass', color: '#b08d57', price: 4000 },
      ],
    },
    {
      type: 'dimension',
      id: 'width',
      label: 'Width',
      unit: 'cm',
      min: 78,
      max: 118,
      step: 10,
      default: 88,
      nativeSize: 88,
      axes: ['x'],
      behaviors: [
        { part: 'body', mode: 'stretch' },
        { part: 'top', mode: 'stretch' },
        { part: 'feet', mode: 'anchor' },
      ],
      pricePerStep: 6000,
    },
  ],
  pricing: { currency: 'USD', base: 44900 },
  rules: [],
  scene: {
    background: { type: 'radial', inner: '#f7f3ee', outer: '#e2d9cc' },
    lighting: 'warm',
    floor: false,
    shadows: true,
    cyclorama: true,
  },
  presentation: { layout: 'sidebar', theme: { accent: '#8a4b25' } },
} satisfies ProductConfigInput;
