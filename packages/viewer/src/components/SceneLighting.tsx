import { Suspense, useCallback } from 'react';

import {
  type EnvironmentResolution,
  type EnvironmentSources,
  environmentUrl,
  isEnvironmentId,
} from '../environments';
import type { Stage } from '../internal/stage';
import type { SceneSettings } from '../scene';
import { EnvironmentLighting } from './EnvironmentLighting';
import { ErrorBoundary } from './ErrorBoundary';
import { Lighting } from './Lighting';

export interface SceneLightingProps {
  scene: SceneSettings;
  stage: Stage;
  shadowMapSize: number;
  sources: EnvironmentSources;
  resolution: EnvironmentResolution;
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
  const warn = useCallback(
    (error: unknown) =>
      console.warn('[twirl] Environment failed to load; using studio lighting.', error),
    [],
  );
  if (!isEnvironmentId(id)) return procedural;

  const bg = scene.background;
  const backgroundBlur = bg.type === 'environment' ? bg.blur : null;
  const ground = bg.type === 'environment' && bg.ground === true;
  const common = { id, stage, shadows: scene.shadows, shadowMapSize, backgroundBlur, ground };
  const url1k = environmentUrl(id, '1k', sources);
  const url = environmentUrl(id, resolution, sources);
  const base = <EnvironmentLighting {...common} url={url1k} />;

  return (
    <ErrorBoundary key={url1k} onError={warn} fallback={procedural}>
      <Suspense fallback={procedural}>
        {url === url1k ? (
          base
        ) : (
          // If only the 2k file fails, keep the 1k one.
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
