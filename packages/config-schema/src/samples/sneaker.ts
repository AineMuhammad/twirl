import type { ProductConfigInput } from '../config';

/**
 * Demo product: a knit running shoe (samples/sneaker.glb, Shopify via Khronos, CC BY 4.0). The
 * source was one mesh; it was split into upper, tongue and heel tab, side stripes, sole, laces
 * and eyelets. Prices in US cents.
 */
export const sneakerConfig = {
  schemaVersion: 1,
  product: {
    name: 'Stride Knit Runner',
    description: 'A lightweight knit running shoe. Design every panel, from upper to laces.',
  },
  parts: [
    { id: 'upper', label: 'Upper', meshes: ['Upper'] },
    { id: 'tongue', label: 'Tongue & heel tab', meshes: ['Tongue_Heel_Tab'] },
    { id: 'stripes', label: 'Side stripes', meshes: ['Side_Stripes'] },
    { id: 'sole', label: 'Sole', meshes: ['Sole'] },
    { id: 'laces', label: 'Laces', meshes: ['Laces', 'Eyelets'] },
  ],
  groups: [
    {
      type: 'color',
      id: 'upper',
      label: 'Upper',
      parts: ['upper'],
      default: null,
      originalLabel: 'Ocean knit',
      swatches: [
        { id: 'black', label: 'Black', color: '#1d1d1f' },
        { id: 'white', label: 'Cloud white', color: '#efefea' },
        { id: 'forest', label: 'Forest', color: '#2f4a3a' },
        { id: 'crimson', label: 'Crimson', color: '#9b1c24' },
        { id: 'sand', label: 'Sand', color: '#c9b48f' },
      ],
      allowCustom: true,
      customPrice: 1500,
    },
    {
      type: 'color',
      id: 'tongue',
      label: 'Tongue & heel tab',
      parts: ['tongue'],
      default: null,
      originalLabel: 'Sky blue',
      swatches: [
        { id: 'black', label: 'Black', color: '#1d1d1f' },
        { id: 'white', label: 'White', color: '#efefea' },
        { id: 'volt', label: 'Volt', color: '#c7e33b' },
      ],
    },
    {
      type: 'color',
      id: 'stripes',
      label: 'Side stripes',
      parts: ['stripes'],
      default: null,
      originalLabel: 'Deep navy',
      swatches: [
        { id: 'black', label: 'Black', color: '#1d1d1f' },
        { id: 'white', label: 'White', color: '#efefea' },
        { id: 'volt', label: 'Volt', color: '#c7e33b' },
        { id: 'crimson', label: 'Crimson', color: '#9b1c24' },
      ],
    },
    {
      type: 'color',
      id: 'sole',
      label: 'Sole',
      parts: ['sole'],
      default: null,
      originalLabel: 'White',
      swatches: [
        { id: 'gum', label: 'Gum', color: '#b5814b', price: 1000 },
        { id: 'black', label: 'Black', color: '#1b1b1b' },
      ],
    },
    {
      type: 'color',
      id: 'laces',
      label: 'Laces',
      parts: ['laces'],
      default: null,
      originalLabel: 'Charcoal',
      swatches: [
        { id: 'white', label: 'White', color: '#efefea' },
        { id: 'volt', label: 'Volt', color: '#c7e33b' },
        { id: 'crimson', label: 'Crimson', color: '#9b1c24' },
      ],
    },
  ],
  pricing: { currency: 'USD', base: 12900 },
  rules: [
    {
      type: 'requires',
      id: 'gum-sole-uppers',
      when: { group: 'sole', equals: 'gum' },
      require: { group: 'upper', oneOf: ['original', 'black', 'forest', 'sand'] },
      message: 'Gum soles come with Ocean, Black, Forest or Sand uppers.',
    },
  ],
  scene: {
    background: { type: 'radial', inner: '#f5f8fb', outer: '#d6e0ea' },
    lighting: 'studio',
    floor: false,
    shadows: true,
    cyclorama: true,
  },
  presentation: {
    layout: 'sidebar',
    theme: { accent: '#1f6fa8' },
    camera: { initialView: 'side' },
  },
} satisfies ProductConfigInput;
