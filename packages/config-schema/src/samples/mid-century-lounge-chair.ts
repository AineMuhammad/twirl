import type { ProductConfigInput } from '../config';

/**
 * Demo product: a mid-century swivel lounge chair with moulded wood shells and leather cushions
 * (samples/mid-century-lounge-chair.glb, "Mid Century Lounge Chair" by Kuutti Siitonen on Poly
 * Haven, CC0). Prices in US cents.
 */
export const midCenturyLoungeChairConfig = {
  schemaVersion: 1,
  product: {
    name: 'Eamon Lounge Chair',
    description:
      'A swivel lounge chair: moulded wood shells, leather cushions, cast aluminium base.',
  },
  parts: [
    { id: 'cushions', label: 'Cushions', meshes: ['Seat_Cushion', 'Back_Cushion'] },
    { id: 'shells', label: 'Wood shells', meshes: ['Seat_Shell', 'Back_Shell'] },
    { id: 'base', label: 'Base', meshes: ['Base'] },
    { id: 'swivel', label: 'Swivel', meshes: ['Swivel'] },
  ],
  groups: [
    {
      type: 'color',
      id: 'leather',
      label: 'Leather',
      parts: ['cushions'],
      default: null,
      originalLabel: 'Chocolate',
      swatches: [
        { id: 'black', label: 'Black', color: '#1c1a19' },
        { id: 'cognac', label: 'Cognac', color: '#8a4b25' },
        { id: 'tan', label: 'Saddle tan', color: '#a87443' },
        { id: 'ivory', label: 'Ivory', color: '#e6dccb', price: 25000 },
      ],
    },
    {
      type: 'color',
      id: 'veneer',
      label: 'Wood veneer',
      parts: ['shells'],
      default: null,
      originalLabel: 'Teak',
      swatches: [
        { id: 'walnut', label: 'Walnut', color: '#5c3a22' },
        { id: 'white-oak', label: 'White oak', color: '#cdb48e' },
        { id: 'ebony', label: 'Ebonised ash', color: '#2a2522', price: 20000 },
      ],
    },
    {
      type: 'color',
      id: 'base',
      label: 'Base',
      parts: ['base', 'swivel'],
      default: null,
      originalLabel: 'Polished aluminium',
      swatches: [{ id: 'black', label: 'Matte black', color: '#1b1b1b' }],
    },
  ],
  pricing: { currency: 'USD', base: 245000 },
  rules: [
    {
      type: 'availability',
      id: 'ivory-light-woods',
      when: { group: 'leather', equals: 'ivory' },
      target: { group: 'veneer', options: ['ebony'] },
      effect: 'disable',
      message: 'Ivory leather is paired with teak, walnut or white oak.',
    },
  ],
  scene: {
    background: { type: 'radial', inner: '#f7f3ee', outer: '#e2d9cc' },
    lighting: 'warm',
    floor: false,
    shadows: true,
    cyclorama: true,
  },
  presentation: { layout: 'sidebar', theme: { accent: '#5c3a22', font: 'instrument-serif' } },
} satisfies ProductConfigInput;
