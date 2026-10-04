import type { ProductConfigInput } from '@twirl/config-schema';
import {
  accentChairConfig,
  barnSconceConfig,
  beverageCoolerConfig,
  boomboxConfig,
  chesterfieldSofaConfig,
  corsetConfig,
  glamSofaConfig,
  glassTableLampConfig,
  jeepConfig,
  loungeChairConfig,
  silkPoufConfig,
  sneakerConfig,
  sunglassesConfig,
  teacupConfig,
  toyCarConfig,
  tulipLampConfig,
  waterBottleConfig,
} from '@twirl/config-schema/samples';

import { hostedSampleUrl } from './sample-urls';

export { HOSTED_SAMPLES_VERSION, hostedSampleUrl } from './sample-urls';

/** Markets the demo catalogue covers, in the order the picker lists them. */
export const SAMPLE_CATEGORIES = [
  'Furniture',
  'Lighting',
  'Fashion',
  'Home & kitchen',
  'Electronics',
  'Vehicles & toys',
  'Commercial',
] as const;
export type SampleCategory = (typeof SAMPLE_CATEGORIES)[number];

export interface SampleModel {
  id: string;
  label: string;
  category: SampleCategory;
  url: string;
  /** The product config, as a merchant would save it (parsed when the sample opens). */
  config: ProductConfigInput;
}

export const SAMPLE_MODELS: SampleModel[] = [
  {
    id: 'sofa',
    label: 'Lounge chair',
    category: 'Furniture',
    url: hostedSampleUrl('sofa.glb'),
    config: loungeChairConfig,
  },
  {
    id: 'glam-sofa',
    label: 'Velvet sofa',
    category: 'Furniture',
    url: hostedSampleUrl('glam-sofa.glb'),
    config: glamSofaConfig,
  },
  {
    id: 'chesterfield-sofa',
    label: 'Leather sofa',
    category: 'Furniture',
    url: hostedSampleUrl('chesterfield-sofa.glb'),
    config: chesterfieldSofaConfig,
  },
  {
    id: 'accent-chair',
    label: 'Accent chair',
    category: 'Furniture',
    url: hostedSampleUrl('accent-chair.glb'),
    config: accentChairConfig,
  },
  {
    id: 'silk-pouf',
    label: 'Pouf',
    category: 'Furniture',
    url: hostedSampleUrl('silk-pouf.glb'),
    config: silkPoufConfig,
  },
  {
    id: 'glass-table-lamp',
    label: 'Table lamp',
    category: 'Lighting',
    url: hostedSampleUrl('glass-table-lamp.glb'),
    config: glassTableLampConfig,
  },
  {
    id: 'tulip-lamp',
    label: 'Arc lamp',
    category: 'Lighting',
    url: hostedSampleUrl('tulip-lamp.glb'),
    config: tulipLampConfig,
  },
  {
    id: 'barn-sconce',
    label: 'Wall sconce',
    category: 'Lighting',
    url: hostedSampleUrl('barn-sconce.glb'),
    config: barnSconceConfig,
  },
  {
    id: 'sneaker',
    label: 'Sneaker',
    category: 'Fashion',
    url: hostedSampleUrl('sneaker.glb'),
    config: sneakerConfig,
  },
  {
    id: 'corset',
    label: 'Corset',
    category: 'Fashion',
    url: hostedSampleUrl('corset-dress-form.glb'),
    config: corsetConfig,
  },
  {
    id: 'sunglasses',
    label: 'Sunglasses',
    category: 'Fashion',
    url: hostedSampleUrl('aviator-sunglasses.glb'),
    config: sunglassesConfig,
  },
  {
    id: 'teacup',
    label: 'Teacup set',
    category: 'Home & kitchen',
    url: hostedSampleUrl('teacup-set.glb'),
    config: teacupConfig,
  },
  {
    id: 'water-bottle',
    label: 'Water bottle',
    category: 'Home & kitchen',
    url: hostedSampleUrl('water-bottle.glb'),
    config: waterBottleConfig,
  },
  {
    id: 'boombox',
    label: 'Boombox',
    category: 'Electronics',
    url: hostedSampleUrl('boombox.glb'),
    config: boomboxConfig,
  },
  {
    id: 'jeep',
    label: 'Jeep',
    category: 'Vehicles & toys',
    url: hostedSampleUrl('jeep_2021.glb'),
    config: jeepConfig,
  },
  {
    id: 'toy-car',
    label: 'Toy car',
    category: 'Vehicles & toys',
    url: hostedSampleUrl('toy-car.glb'),
    config: toyCarConfig,
  },
  {
    id: 'beverage-cooler',
    label: 'Beverage cooler',
    category: 'Commercial',
    url: hostedSampleUrl('beverage-cooler.glb'),
    config: beverageCoolerConfig,
  },
];

export { ENVIRONMENT_SOURCES } from './environments';
