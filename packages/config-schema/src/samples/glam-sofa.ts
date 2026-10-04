import type { ProductConfigInput } from '../config';

const legs = Array.from({ length: 18 }, (_, i) => `Leg-${String(i + 1).padStart(2, '0')}`);
const feet = Array.from({ length: 9 }, (_, i) => `Foot-${String(i + 1).padStart(2, '0')}`);

/**
 * Demo product: a curved velvet sofa (samples/glam-sofa.glb, Wayfair via Khronos, CC BY 4.0).
 * Each leg and foot cap is its own node, so the width slider moves them instead of stretching
 * them. Prices in US cents.
 */
export const glamSofaConfig = {
  schemaVersion: 1,
  product: {
    name: 'Margot Curved Velvet Sofa',
    description: 'A sculpted, curved sofa in plush velvet on slim tapered legs.',
  },
  parts: [
    { id: 'upholstery', label: 'Upholstery', meshes: ['Upholstery'] },
    { id: 'legs', label: 'Legs', meshes: legs },
    { id: 'foot-caps', label: 'Foot caps', meshes: feet },
  ],
  groups: [
    {
      type: 'color',
      id: 'velvet',
      label: 'Velvet',
      parts: ['upholstery'],
      default: null,
      originalLabel: 'Navy velvet',
      swatches: [
        { id: 'champagne', label: 'Champagne', color: '#d9c7a7' },
        { id: 'blush', label: 'Blush', color: '#d8a7a0' },
        { id: 'emerald', label: 'Emerald', color: '#1f5a45' },
        { id: 'charcoal', label: 'Charcoal', color: '#3a3b3d' },
        { id: 'saffron', label: 'Saffron', color: '#c49a3a', price: 15000 },
      ],
      allowCustom: true,
      customPrice: 20000,
    },
    {
      type: 'color',
      id: 'leg-finish',
      label: 'Leg finish',
      parts: ['legs'],
      default: null,
      originalLabel: 'Matte black',
      swatches: [
        { id: 'brass', label: 'Brushed brass', color: '#b08d57', price: 12000 },
        { id: 'chrome', label: 'Polished chrome', color: '#c9ccd1', price: 9000 },
      ],
    },
    {
      type: 'color',
      id: 'foot-caps',
      label: 'Foot caps',
      parts: ['foot-caps'],
      default: null,
      originalLabel: 'Champagne gold',
      swatches: [
        { id: 'black', label: 'Black', color: '#1b1b1b' },
        { id: 'chrome', label: 'Chrome', color: '#c9ccd1' },
      ],
    },
    {
      type: 'dimension',
      id: 'width',
      label: 'Width',
      unit: 'cm',
      min: 180,
      max: 260,
      step: 10,
      default: 220,
      nativeSize: 220,
      axes: ['x'],
      behaviors: [
        { part: 'upholstery', mode: 'stretch' },
        { part: 'legs', mode: 'anchor' },
        { part: 'foot-caps', mode: 'anchor' },
      ],
      pricePerStep: 9000,
    },
  ],
  pricing: { currency: 'USD', base: 189900 },
  rules: [
    {
      type: 'availability',
      id: 'brass-legs-gold-caps',
      when: { group: 'leg-finish', equals: 'brass' },
      target: { group: 'foot-caps', options: ['chrome'] },
      effect: 'disable',
      message: 'Brass legs come with gold or black caps.',
    },
  ],
  scene: {
    background: { type: 'radial', inner: '#f7f3ee', outer: '#e2d9cc' },
    lighting: 'warm',
    floor: false,
    shadows: true,
    cyclorama: true,
  },
  presentation: { layout: 'sidebar', theme: { accent: '#2f4a6d', font: 'instrument-serif' } },
} satisfies ProductConfigInput;
