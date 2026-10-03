import type { ProductConfigInput } from '../config';

/**
 * Demo product: a compact SUV (samples/jeep_2021.glb). Realistic demo content; prices in US
 * cents. Note `Wheel_Rims_Caps` holds the roof rails (plus a small rear trim) and
 * `Wheel_Rims_Gold` the wheel centre caps and brake calipers.
 */
export const jeepConfig = {
  schemaVersion: 1,
  product: {
    name: 'Trailhawk Compact SUV',
    description: 'A compact 4x4 with a panoramic sunroof. Configure paint and accessories.',
  },
  parts: [
    { id: 'body', label: 'Body', meshes: ['Body_Exterior'] },
    { id: 'calipers', label: 'Brake calipers', meshes: ['Wheel_Rims_Gold'] },
    { id: 'roof-rails', label: 'Roof rails', meshes: ['Wheel_Rims_Caps'] },
    { id: 'sunroof', label: 'Sunroof glass', meshes: ['Windows_Tinted_Dark'] },
  ],
  groups: [
    {
      type: 'color',
      id: 'paint',
      label: 'Paint',
      parts: ['body'],
      default: null,
      originalLabel: 'Desert gold metallic',
      swatches: [
        { id: 'bright-white', label: 'Bright white', color: '#f1f1ee' },
        { id: 'jet-black', label: 'Jet black', color: '#111214' },
        { id: 'granite', label: 'Granite metallic', color: '#5b6066', price: 49500 },
        { id: 'sting-gray', label: 'Sting gray metallic', color: '#9aa0a3', price: 49500 },
        { id: 'hydro-blue', label: 'Hydro blue metallic', color: '#1f4f7a', price: 49500 },
        { id: 'velvet-red', label: 'Velvet red metallic', color: '#7a1f24', price: 49500 },
      ],
    },
    {
      type: 'color',
      id: 'calipers',
      label: 'Brake calipers',
      parts: ['calipers'],
      default: null,
      originalLabel: 'Gold',
      swatches: [
        { id: 'red', label: 'Performance red', color: '#b3261e', price: 30000 },
        { id: 'black', label: 'Gloss black', color: '#1b1b1b', price: 30000 },
      ],
    },
    {
      type: 'visibility',
      id: 'roof-rails',
      label: 'Roof rails',
      description: 'Aluminium rails rated for 75 kg.',
      parts: ['roof-rails'],
      default: false,
      price: 35000,
    },
    {
      type: 'color',
      id: 'sunroof-glass',
      label: 'Sunroof glass',
      parts: ['sunroof'],
      default: null,
      originalLabel: 'Privacy tint',
      swatches: [{ id: 'light-tint', label: 'Light tint', color: '#55606b' }],
    },
  ],
  pricing: { currency: 'USD', base: 3200000 },
  rules: [
    {
      type: 'excludes',
      id: 'red-calipers-not-red-paint',
      a: { group: 'calipers', equals: 'red' },
      b: { group: 'paint', equals: 'velvet-red' },
      message: "Red calipers aren't offered with Velvet red paint.",
    },
    {
      type: 'requires',
      id: 'rails-metallic-only',
      when: { group: 'roof-rails', equals: true },
      require: {
        group: 'paint',
        oneOf: ['original', 'granite', 'sting-gray', 'hydro-blue', 'velvet-red'],
      },
      message: 'Roof rails come with metallic paints only.',
    },
  ],
  scene: {
    background: { type: 'radial', inner: '#f8fbff', outer: '#d5dfec' },
    lighting: 'studio',
    floor: false,
    shadows: true,
    cyclorama: true,
  },
  presentation: { layout: 'sidebar' },
} satisfies ProductConfigInput;
