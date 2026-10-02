import { useEffect, useMemo } from 'react';
import type { Texture } from 'three';
import { GroundedSkybox } from 'three/examples/jsm/objects/GroundedSkybox.js';

import { groundProjection } from '../internal/ground';
import type { Stage } from '../internal/stage';

/** Projects the panorama's floor onto a ground plane at the model's base. */
export function GroundedEnvironment({ map, stage }: { map: Texture; stage: Stage }) {
  const { height, radius, y } = groundProjection(stage);
  const skybox = useMemo(() => new GroundedSkybox(map, height, radius), [map, height, radius]);

  useEffect(
    () => () => {
      skybox.geometry.dispose();
      skybox.material.dispose();
    },
    [skybox],
  );

  return <primitive object={skybox} position={[stage.center[0], y, stage.center[2]]} />;
}
