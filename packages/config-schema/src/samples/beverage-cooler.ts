import type { ProductConfigInput } from '../config';

/**
 * Demo product: a glass-door commercial beverage cooler (samples/beverage-cooler.glb,
 * Darmstadt Graphics Group via Khronos, CC BY 4.0). A B2B example: quote requests rather than
 * cart checkout. The source's door animation was removed. Prices in US cents.
 */
export const beverageCoolerConfig = {
  schemaVersion: 1,
  product: {
    name: 'Icey Glass-Door Cooler',
    description: 'A single-door merchandiser for stores and cafés, 650 L, with LED shelf lighting.',
  },
  parts: [
    { id: 'cabinet', label: 'Cabinet', meshes: ['Cabinet', 'Door_Frame'] },
    { id: 'interior', label: 'Interior', meshes: ['Interior', 'Door_Inner'] },
    { id: 'glass', label: 'Door glass', meshes: ['Door_Glass'] },
    { id: 'stock', label: 'Merchandise', meshes: ['Bottles'] },
  ],
  groups: [
    {
      type: 'color',
      id: 'cabinet',
      label: 'Cabinet finish',
      parts: ['cabinet'],
      default: null,
      originalLabel: 'Graphite',
      swatches: [
        { id: 'white', label: 'White', color: '#efefef' },
        { id: 'stainless', label: 'Stainless steel', color: '#b9bcbf', price: 15000 },
        { id: 'brand-red', label: 'Brand red', color: '#b3261e', price: 20000 },
        { id: 'brand-blue', label: 'Brand blue', color: '#1f4f8f', price: 20000 },
      ],
      allowCustom: true,
      customPrice: 30000,
    },
    {
      type: 'color',
      id: 'glass',
      label: 'Door glass',
      parts: ['glass'],
      default: null,
      originalLabel: 'Clear low-E',
      swatches: [{ id: 'bronze', label: 'Bronze tint', color: '#6b5a45', price: 12000 }],
    },
    {
      type: 'visibility',
      id: 'stocked',
      label: 'Show stocked',
      description: 'Preview with merchandise loaded. Display only.',
      parts: ['stock'],
      default: true,
    },
  ],
  pricing: { currency: 'USD', base: 189900 },
  rules: [
    {
      type: 'availability',
      id: 'stainless-clear-glass',
      when: { group: 'cabinet', equals: 'stainless' },
      target: { group: 'glass', options: ['bronze'] },
      effect: 'disable',
      message: 'Stainless cabinets ship with clear glass only.',
    },
  ],
  scene: {
    background: { type: 'gradient', from: '#f2f4f6', to: '#cfd6dd' },
    lighting: 'empty_warehouse_01',
    floor: false,
    shadows: true,
    cyclorama: true,
  },
  presentation: { layout: 'sidebar', theme: { accent: '#1f6fb0' } },
} satisfies ProductConfigInput;
