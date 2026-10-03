import type { ProductConfigInput } from '../config';

/**
 * Demo product: a round lounge chair (samples/sofa.glb). Realistic demo content; prices are in
 * US cents. Meshes: `iron` (frame), `Chair` (seat cushion), `Pillow_01`, `Pillow_02`.
 */
export const loungeChairConfig = {
  schemaVersion: 1,
  product: {
    name: 'Halo Lounge Chair',
    description: 'A deep, round lounge chair on a slim steel frame, with two loose cushions.',
  },
  parts: [
    { id: 'frame', label: 'Frame', meshes: ['iron'] },
    { id: 'seat', label: 'Seat cushion', meshes: ['Chair'] },
    { id: 'pillow-diamond', label: 'Diamond cushion', meshes: ['Pillow_01'] },
    { id: 'pillow-navy', label: 'Navy cushion', meshes: ['Pillow_02'] },
  ],
  groups: [
    {
      type: 'color',
      id: 'fabric',
      label: 'Seat fabric',
      parts: ['seat'],
      default: null,
      originalLabel: 'Lagoon weave',
      swatches: [
        { id: 'oat-linen', label: 'Oat linen', color: '#d8ccb6' },
        { id: 'sage', label: 'Sage', color: '#8fa58a' },
        { id: 'terracotta', label: 'Terracotta', color: '#b5532f' },
        { id: 'charcoal', label: 'Charcoal', color: '#3b3a39' },
        { id: 'teal-velvet', label: 'Teal velvet', color: '#2f6f6a', price: 6000 },
        { id: 'ink-velvet', label: 'Ink velvet', color: '#232b4a', price: 6000 },
      ],
      allowCustom: true,
      customPrice: 2500,
    },
    {
      type: 'color',
      id: 'frame-finish',
      label: 'Frame finish',
      parts: ['frame'],
      default: null,
      originalLabel: 'Matte black',
      swatches: [
        { id: 'brass', label: 'Brushed brass', color: '#b08d57', price: 12000 },
        { id: 'rust', label: 'Rust', color: '#a4553a', price: 8000 },
        { id: 'bone', label: 'Bone white', color: '#e8e2d6', price: 8000 },
      ],
    },
    {
      type: 'visibility',
      id: 'pillow-diamond',
      label: 'Diamond cushion',
      description: 'Woven diamond pattern, 50 × 50 cm.',
      parts: ['pillow-diamond'],
      default: true,
      price: 4900,
    },
    {
      type: 'visibility',
      id: 'pillow-navy',
      label: 'Navy cushion',
      description: 'Textured navy cotton, 40 × 40 cm.',
      parts: ['pillow-navy'],
      default: true,
      price: 3900,
    },
    {
      type: 'dimension',
      id: 'diameter',
      label: 'Diameter',
      unit: 'cm',
      min: 100,
      max: 140,
      step: 5,
      default: 120,
      nativeSize: 120,
      axes: ['x', 'z'],
      behaviors: [
        { part: 'frame', mode: 'stretch' },
        { part: 'seat', mode: 'stretch' },
        { part: 'pillow-diamond', mode: 'anchor' },
        { part: 'pillow-navy', mode: 'anchor' },
      ],
      pricePerStep: 4000,
    },
  ],
  pricing: { currency: 'USD', base: 89900 },
  rules: [
    {
      type: 'excludes',
      id: 'brass-not-terracotta',
      a: { group: 'frame-finish', equals: 'brass' },
      b: { group: 'fabric', equals: 'terracotta' },
      message: "Brushed brass isn't offered with terracotta fabric.",
    },
    {
      type: 'requires',
      id: 'large-needs-brass',
      when: { group: 'diameter', min: 135 },
      require: { group: 'frame-finish', equals: 'brass' },
      message: 'Sizes of 135 cm and up use the reinforced brass frame.',
    },
    {
      type: 'availability',
      id: 'navy-with-dark-fabrics',
      when: { group: 'fabric', oneOf: ['oat-linen', 'sage'] },
      target: { group: 'pillow-navy' },
      effect: 'disable',
      message: 'The navy cushion is only offered with darker fabrics.',
    },
  ],
  scene: {
    background: { type: 'radial', inner: '#fffaf3', outer: '#eadbc8' },
    lighting: 'warm',
    floor: false,
    shadows: true,
    cyclorama: true,
  },
  presentation: { layout: 'sidebar', theme: { font: 'instrument-serif' } },
} satisfies ProductConfigInput;
