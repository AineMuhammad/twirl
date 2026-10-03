import type { ProductConfigInput } from '@twirl/config-schema';
import { jeepConfig, loungeChairConfig } from '@twirl/config-schema/samples';
import type { EnvironmentSources } from '@twirl/viewer';

import { clientEnv } from '@/env/client';

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

/** 1k HDRIs ship with the app; 2k come from the asset bucket when it's configured. */
export const ENVIRONMENT_SOURCES: EnvironmentSources = clientEnv.NEXT_PUBLIC_ASSETS_BASE_URL
  ? { '1k': '/hdri/1k/', '2k': `${clientEnv.NEXT_PUBLIC_ASSETS_BASE_URL}/hdri/2k/` }
  : { '1k': '/hdri/1k/' };
