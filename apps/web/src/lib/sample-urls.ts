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

/** Folder of the hosted room scenes (built by tools/rooms). Bump it when a room changes. */
export const HOSTED_ROOMS_VERSION = 'v1';

/** Where a room scene is served from: the asset bucket, or the app's own `/rooms/` locally. */
export function hostedRoomUrl(file: string, base = clientEnv.NEXT_PUBLIC_ASSETS_BASE_URL) {
  return base ? `${base}/rooms/${HOSTED_ROOMS_VERSION}/${file}` : `/rooms/${file}`;
}

/** Folder of the hosted material library (built by tools/materials). Bump it when it changes. */
export const HOSTED_MATERIALS_VERSION = 'v1';

/** Where library materials (fabrics, leathers, woods) are served from, ending in `/`. */
export function hostedMaterialsUrl(base = clientEnv.NEXT_PUBLIC_ASSETS_BASE_URL) {
  return base ? `${base}/materials/${HOSTED_MATERIALS_VERSION}/` : '/materials/';
}

/** The material library's URL for this deployment. */
export const MATERIALS_URL = hostedMaterialsUrl();
