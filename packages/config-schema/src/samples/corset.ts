import type { ProductConfigInput } from '../config';

/**
 * Demo product: a brocade corset on a dress form (samples/corset-dress-form.glb, UX3D via
 * Khronos, CC0). The source was one mesh; it was split into corset, straps, hardware, choker,
 * dress form and stand. Prices in US cents.
 */
export const corsetConfig = {
  schemaVersion: 1,
  product: {
    name: 'Victoria Brocade Corset',
    description: 'A steel-boned brocade corset with buckled straps and a matching choker.',
  },
  parts: [
    { id: 'corset', label: 'Corset', meshes: ['Corset'] },
    { id: 'straps', label: 'Straps', meshes: ['Straps'] },
    { id: 'hardware', label: 'Clasps & grommets', meshes: ['Hardware'] },
    { id: 'choker', label: 'Choker', meshes: ['Choker'] },
    { id: 'form', label: 'Dress form', meshes: ['Dress_Form', 'Stand'] },
  ],
  groups: [
    {
      type: 'color',
      id: 'fabric',
      label: 'Brocade',
      parts: ['corset'],
      default: null,
      originalLabel: 'Burgundy brocade',
      swatches: [
        { id: 'black', label: 'Black', color: '#151515' },
        { id: 'ivory', label: 'Ivory', color: '#e8e0d0' },
        { id: 'emerald', label: 'Emerald', color: '#1f4f3c' },
        { id: 'navy', label: 'Navy', color: '#1e2a44' },
        { id: 'blush', label: 'Blush', color: '#d9a6a1' },
      ],
      allowCustom: true,
      customPrice: 2500,
    },
    {
      type: 'color',
      id: 'straps',
      label: 'Straps',
      parts: ['straps'],
      default: null,
      originalLabel: 'Antique leather',
      swatches: [
        { id: 'black', label: 'Black leather', color: '#1a1a1a' },
        { id: 'cognac', label: 'Cognac', color: '#8a4b25' },
      ],
    },
    {
      type: 'color',
      id: 'hardware',
      label: 'Hardware',
      parts: ['hardware'],
      default: null,
      originalLabel: 'Antique silver',
      swatches: [
        { id: 'gold', label: 'Gold', color: '#c3a053', price: 1500 },
        { id: 'gunmetal', label: 'Gunmetal', color: '#3d3f42' },
      ],
    },
    {
      type: 'visibility',
      id: 'choker',
      label: 'Matching choker',
      description: 'Velvet choker with a pendant.',
      parts: ['choker'],
      default: true,
      price: 2900,
    },
    {
      type: 'visibility',
      id: 'display-form',
      label: 'Show on dress form',
      description: 'Display only; not included.',
      parts: ['form'],
      default: true,
    },
  ],
  pricing: { currency: 'USD', base: 14900 },
  rules: [
    {
      type: 'excludes',
      id: 'blush-not-gunmetal',
      a: { group: 'fabric', equals: 'blush' },
      b: { group: 'hardware', equals: 'gunmetal' },
      message: "Gunmetal hardware isn't offered with blush brocade.",
    },
  ],
  scene: {
    background: { type: 'radial', inner: '#f8f2f0', outer: '#dcc9c5' },
    lighting: 'photo_studio_loft_hall',
    floor: false,
    shadows: true,
    cyclorama: true,
  },
  presentation: { layout: 'sidebar', theme: { accent: '#7d2335', font: 'instrument-serif' } },
} satisfies ProductConfigInput;
