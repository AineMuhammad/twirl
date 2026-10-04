import { clientEnv } from '@/env/client';

/**
 * Folder of the hosted sample files (`sample-manifest.json`'s `version`; a test keeps them in
 * sync). Hosted files are immutable, so a rebuilt model ships in a new folder.
 */
export const HOSTED_SAMPLES_VERSION = 'v1';

/**
 * Where a sample model is served from: the asset bucket (`samples/<version>/`) when it's
 * configured, otherwise the app's own `/samples/` (the lounge chair and jeep ship there;
 * `tools/sample-models` writes local copies of the rest). See ADR 0013.
 */
export function hostedSampleUrl(file: string, base = clientEnv.NEXT_PUBLIC_ASSETS_BASE_URL) {
  return base ? `${base}/samples/${HOSTED_SAMPLES_VERSION}/${file}` : `/samples/${file}`;
}
