import type { EnvironmentSources } from '@twirl/viewer';

import { clientEnv } from '@/env/client';

/** 1k HDRIs ship with the app; 2k come from the asset bucket when it's configured. */
export const ENVIRONMENT_SOURCES: EnvironmentSources = clientEnv.NEXT_PUBLIC_ASSETS_BASE_URL
  ? { '1k': '/hdri/1k/', '2k': `${clientEnv.NEXT_PUBLIC_ASSETS_BASE_URL}/hdri/2k/` }
  : { '1k': '/hdri/1k/' };
