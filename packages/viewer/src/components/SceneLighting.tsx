import { Suspense, useCallback } from 'react';

import {
  type EnvironmentResolution,
  type EnvironmentSources,
  environmentUrl,
  isEnvironmentId,
} from '../environments';
import type { Stage } from '../internal/stage';
import type { SceneSettings } from '../scene';
import type { EnvironmentStatus } from '../types';
import { EnvironmentLighting } from './EnvironmentLighting';
import { ErrorBoundary } from './ErrorBoundary';
import { Lighting } from './Lighting';
import { StatusReporter } from './StatusReporter';

export interface SceneLightingProps {
  scene: SceneSettings;
  stage: Stage;
  shadowMapSize: number;
  sources: EnvironmentSources;
  resolution: EnvironmentResolution;
  onStatus: (status: EnvironmentStatus) => void;
}

/**
 * Procedural presets render immediately. HDRI environments load progressively:
 * procedural studio light while the 1k file downloads, then 1k while 2k downloads (large
 * screens only). If an HDRI fails (offline, CORS), procedural lighting stays.
 */
export function SceneLighting({
  scene,
  stage,
  shadowMapSize,
  sources,
  resolution,
  onStatus,
}: SceneLightingProps) {
  const procedural = (
    <Lighting
      preset={isEnvironmentId(scene.lighting) ? 'studio' : scene.lighting}
      stage={stage}
      shadows={scene.shadows}
      shadowMapSize={shadowMapSize}
    />
  );
  const id = scene.lighting;
  const failed = useCallback(
    (error: unknown) => {
      console.warn('[twirl] Environment failed to load; using studio lighting.', error);
      onStatus('error');
    },
    [onStatus],
  );
  const warn = useCallback(
    (error: unknown) => console.warn('[twirl] 2k environment failed; keeping 1k.', error),
    [],
  );
  if (!isEnvironmentId(id)) {
    return (
      <>
        <StatusReporter status="ready" onStatus={onStatus} />
        {procedural}
      </>
    );
  }

  const common = { id, stage, shadows: scene.shadows, shadowMapSize };
  const url1k = environmentUrl(id, '1k', sources);
  const url = environmentUrl(id, resolution, sources);
  const base = <EnvironmentLighting {...common} url={url1k} />;

  return (
    <ErrorBoundary key={url1k} onError={failed} fallback={procedural}>
      <Suspense
        fallback={
          <>
            {/* Studio light stands in while the HDRI downloads and decodes. */}
            <StatusReporter status="loading" onStatus={onStatus} />
            {procedural}
          </>
        }
      >
        <StatusReporter status="ready" onStatus={onStatus} />
        {url === url1k ? (
          base
        ) : (
          // The 2k upgrade loads silently over the 1k version; if it fails, 1k stays.
          <ErrorBoundary key={url} onError={warn} fallback={base}>
            <Suspense fallback={base}>
              <EnvironmentLighting {...common} url={url} />
            </Suspense>
          </ErrorBoundary>
        )}
      </Suspense>
    </ErrorBoundary>
  );
}
