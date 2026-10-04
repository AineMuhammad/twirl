import type { ProductConfigInput } from '../config';

/**
 * Demo product: a portable CD boombox (samples/boombox.glb, Khronos, CC0). The source was one
 * mesh; it was split into body, handle, antenna and buttons. Prices in US cents.
 */
export const boomboxConfig = {
  schemaVersion: 1,
  product: {
    name: 'Retro CD Boombox',
    description: 'A portable CD and FM radio player with stereo speakers and a carry handle.',
  },
  parts: [
    { id: 'body', label: 'Body', meshes: ['Body'] },
    { id: 'handle', label: 'Handle', meshes: ['Handle'] },
    { id: 'buttons', label: 'Buttons', meshes: ['Buttons'] },
    { id: 'antenna', label: 'Antenna', meshes: ['Antenna'] },
  ],
  groups: [
    {
      type: 'color',
      id: 'body',
      label: 'Body',
      parts: ['body'],
      default: null,
      originalLabel: 'Black & silver',
      swatches: [
        { id: 'cherry', label: 'Cherry red', color: '#a3202a' },
        { id: 'mint', label: 'Mint', color: '#9fd8c3' },
        { id: 'sky', label: 'Sky blue', color: '#5aa3d8' },
        { id: 'sunshine', label: 'Sunshine', color: '#f0c43a' },
      ],
      allowCustom: true,
      customPrice: 1500,
    },
    {
      type: 'color',
      id: 'handle',
      label: 'Handle',
      parts: ['handle'],
      default: null,
      originalLabel: 'Silver',
      swatches: [
        { id: 'black', label: 'Black', color: '#1b1b1b' },
        { id: 'white', label: 'White', color: '#efefef' },
      ],
    },
    {
      type: 'color',
      id: 'buttons',
      label: 'Buttons',
      parts: ['buttons'],
      default: null,
      originalLabel: 'Graphite',
      swatches: [
        { id: 'red', label: 'Red', color: '#c0302a' },
        { id: 'white', label: 'White', color: '#efefef' },
      ],
    },
    {
      type: 'visibility',
      id: 'antenna',
      label: 'FM antenna',
      description: 'Telescopic, folds away for travel.',
      parts: ['antenna'],
      default: true,
    },
  ],
  pricing: { currency: 'USD', base: 7900 },
  rules: [
    {
      type: 'excludes',
      id: 'red-buttons-not-cherry',
      a: { group: 'buttons', equals: 'red' },
      b: { group: 'body', equals: 'cherry' },
      message: "Red buttons aren't offered on the cherry red body.",
    },
  ],
  scene: {
    background: { type: 'radial', inner: '#fff8ec', outer: '#f0d9b8' },
    lighting: 'studio',
    floor: false,
    shadows: true,
    cyclorama: true,
  },
  presentation: { layout: 'sidebar', theme: { accent: '#d0532f' } },
} satisfies ProductConfigInput;
