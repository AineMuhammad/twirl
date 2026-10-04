import type { ProductConfigInput } from '../config';

/**
 * Demo product: a die-cast toy car (samples/toy-car.glb, Khronos, CC0). The source was one mesh
 * on a display cloth; the cloth was removed and the car split into body, chrome, tyres, windows
 * and lights. Prices in US cents.
 */
export const toyCarConfig = {
  schemaVersion: 1,
  product: {
    name: 'Cruiser Die-Cast Car',
    description: 'A 1:24 die-cast cruiser with chrome trim. Paint your own.',
  },
  parts: [
    { id: 'body', label: 'Body', meshes: ['Body'] },
    { id: 'chrome', label: 'Trim', meshes: ['Chrome'] },
    { id: 'windows', label: 'Windows', meshes: ['Windows'] },
    { id: 'tires', label: 'Tyres', meshes: ['Tires'] },
    { id: 'lights', label: 'Lights', meshes: ['Lights'] },
  ],
  groups: [
    {
      type: 'color',
      id: 'paint',
      label: 'Paint',
      parts: ['body'],
      default: null,
      originalLabel: 'Racing green',
      swatches: [
        { id: 'cherry', label: 'Cherry red', color: '#b3202a' },
        { id: 'sky', label: 'Sky blue', color: '#6aa8d8' },
        { id: 'canary', label: 'Canary', color: '#f2c230' },
        { id: 'pearl', label: 'Pearl white', color: '#efede6' },
        { id: 'black', label: 'Gloss black', color: '#161616' },
      ],
      allowCustom: true,
      customPrice: 300,
    },
    {
      type: 'color',
      id: 'trim',
      label: 'Trim',
      parts: ['chrome'],
      default: null,
      originalLabel: 'Chrome',
      swatches: [
        { id: 'gold', label: 'Gold', color: '#c9a24a', price: 500 },
        { id: 'black-chrome', label: 'Black chrome', color: '#3a3b3e', price: 500 },
      ],
    },
    {
      type: 'color',
      id: 'windows',
      label: 'Windows',
      parts: ['windows'],
      default: null,
      originalLabel: 'Clear',
      swatches: [{ id: 'smoke', label: 'Smoked', color: '#444a50' }],
    },
  ],
  pricing: { currency: 'USD', base: 2499 },
  rules: [
    {
      type: 'excludes',
      id: 'black-on-black',
      a: { group: 'paint', equals: 'black' },
      b: { group: 'trim', equals: 'black-chrome' },
      message: "Black chrome trim isn't offered on gloss black paint.",
    },
  ],
  scene: {
    background: { type: 'radial', inner: '#f3fbf5', outer: '#cfe6d6' },
    lighting: 'studio',
    floor: false,
    shadows: true,
    cyclorama: true,
  },
  presentation: { layout: 'fullscreen', theme: { accent: '#1d7a3f' } },
} satisfies ProductConfigInput;
