import { Environment } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';

import { type EnvironmentId, ENVIRONMENTS } from '../environments';
import { createDeferredDisposer } from '../internal/dispose';
import { keyIntensityFor, raiseToMinElevation } from '../internal/hdr';
import { sunOfTexture } from '../internal/hdr-decode';
import { HDRWorkerLoader } from '../internal/hdr-worker-loader';
import type { SunEstimate } from '../internal/sun';
import type { Stage } from '../internal/stage';
import { KeyLight } from './KeyLight';

const OVERHEAD: SunEstimate = { direction: [0, 1, 0], dominance: 1 };

export interface EnvironmentLightingProps {
  id: EnvironmentId;
  url: string;
  stage: Stage;
  shadows: boolean;
  shadowMapSize: number;
}

/**
 * Image-based lighting from an HDRI (suspends while it loads). The shadow-casting key light
 * comes from the compass direction of the panorama's brightest region, raised to at least 35°
 * so shadows stay under the product.
 */
export function EnvironmentLighting({
  id,
  url,
  stage,
  shadows,
  shadowMapSize,
}: EnvironmentLightingProps) {
  // Fetched, decoded and analysed in a Web Worker; the main thread only uploads the texture.
  const texture = useLoader(HDRWorkerLoader, url);
  const sun: SunEstimate = sunOfTexture(texture) ?? OVERHEAD;
  const keyDirection = useMemo(() => raiseToMinElevation(sun.direction), [sun]);

  // Free the panorama (GPU + cache) when switching away; deferred for StrictMode remounts.
  const disposer = useMemo(
    () =>
      createDeferredDisposer(() => {
        texture.dispose();
        useLoader.clear(HDRWorkerLoader, url);
      }),
    [texture, url],
  );
  useEffect(() => {
    disposer.cancel();
    return () => disposer.schedule();
  }, [disposer]);

  return (
    <>
      <Environment
        map={texture}
        environmentIntensity={ENVIRONMENTS[id].intensity}
        // Lighting and reflections only: the panorama is never drawn as the background.
        background={false}
      />
      <KeyLight
        stage={stage}
        direction={keyDirection}
        color="#ffffff"
        intensity={keyIntensityFor(sun.dominance)}
        shadows={shadows}
        shadowMapSize={shadowMapSize}
      />
    </>
  );
}
