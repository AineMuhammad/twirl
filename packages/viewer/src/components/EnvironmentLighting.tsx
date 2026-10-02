import { Environment } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';

import { type EnvironmentId, ENVIRONMENTS } from '../environments';
import { createDeferredDisposer } from '../internal/dispose';
import { keyIntensityFor, prepareEquirect, sunOf } from '../internal/hdr';
import type { Stage } from '../internal/stage';
import { GroundedEnvironment } from './GroundedEnvironment';
import { KeyLight } from './KeyLight';

export interface EnvironmentLightingProps {
  id: EnvironmentId;
  url: string;
  stage: Stage;
  shadows: boolean;
  shadowMapSize: number;
  /** Show the panorama behind the model; `null` keeps the CSS background. */
  backgroundBlur: number | null;
  /** Project the panorama's floor under the model (implies a visible background). */
  ground: boolean;
}

/**
 * Image-based lighting from an HDRI (suspends while it loads). The shadow-casting key light is
 * aimed at the brightest region of the panorama, so shadows match the photographed light.
 */
export function EnvironmentLighting({
  id,
  url,
  stage,
  shadows,
  shadowMapSize,
  backgroundBlur,
  ground,
}: EnvironmentLightingProps) {
  const loaded = useLoader(HDRLoader, url);
  const texture = useMemo(() => prepareEquirect(loaded), [loaded]);
  const sun = useMemo(() => sunOf(texture), [texture]);

  // Free the panorama (GPU + cache) when switching away; deferred for StrictMode remounts.
  const disposer = useMemo(
    () =>
      createDeferredDisposer(() => {
        texture.dispose();
        useLoader.clear(HDRLoader, url);
      }),
    [texture, url],
  );
  useEffect(() => {
    disposer.cancel();
    return () => disposer.schedule();
  }, [disposer]);

  const showBackground = backgroundBlur !== null && !ground;

  return (
    <>
      <Environment
        map={texture}
        environmentIntensity={ENVIRONMENTS[id].intensity}
        background={showBackground}
        backgroundBlurriness={backgroundBlur ?? 0}
        backgroundIntensity={ENVIRONMENTS[id].intensity}
      />
      {ground && <GroundedEnvironment map={texture} stage={stage} />}
      <KeyLight
        stage={stage}
        direction={sun.direction}
        color="#ffffff"
        intensity={keyIntensityFor(sun.dominance)}
        shadows={shadows}
        shadowMapSize={shadowMapSize}
      />
    </>
  );
}
