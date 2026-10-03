import type { ProductConfigInput } from '@twirl/config-schema';
import { jeepConfig, loungeChairConfig } from '@twirl/config-schema/samples';

export interface SampleModel {
  id: string;
  label: string;
  url: string;
  /** The product config, as a merchant would save it (parsed when the sample opens). */
  config: ProductConfigInput;
}

export const SAMPLE_MODELS: SampleModel[] = [
  { id: 'sofa', label: 'Lounge chair', url: '/samples/sofa.glb', config: loungeChairConfig },
  { id: 'jeep', label: 'Jeep', url: '/samples/jeep_2021.glb', config: jeepConfig },
];

export { ENVIRONMENT_SOURCES } from './environments';
