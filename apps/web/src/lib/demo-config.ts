import type { EnvironmentSources } from '@twirl/viewer';
import type { SceneSettings } from '@twirl/viewer/settings';

import { clientEnv } from '@/env/client';

export interface SampleModel {
  id: string;
  label: string;
  url: string;
  /**
   * The product's default look (lighting, backdrop, studio). In the product editor (M4) merchants
   * set this per product; the demo hard-codes it per sample.
   */
  look: Partial<SceneSettings>;
}

export const SAMPLE_MODELS: SampleModel[] = [
  {
    id: 'sofa',
    label: 'Lounge chair',
    url: '/samples/sofa.glb',
    // Warm, homely light flatters fabric and dark metal.
    look: {
      lighting: 'warm',
      background: { type: 'radial', inner: '#fffaf3', outer: '#eadbc8' },
      cyclorama: true,
    },
  },
  {
    id: 'jeep',
    label: 'Jeep',
    url: '/samples/jeep_2021.glb',
    // Crisp studio light on a cool sweep: clean reflections on paint and chrome.
    look: {
      lighting: 'studio',
      background: { type: 'radial', inner: '#f8fbff', outer: '#d5dfec' },
      cyclorama: true,
    },
  },
];

/** 1k HDRIs ship with the app; 2k come from the asset bucket when it's configured. */
export const ENVIRONMENT_SOURCES: EnvironmentSources = clientEnv.NEXT_PUBLIC_ASSETS_BASE_URL
  ? { '1k': '/hdri/1k/', '2k': `${clientEnv.NEXT_PUBLIC_ASSETS_BASE_URL}/hdri/2k/` }
  : { '1k': '/hdri/1k/' };
