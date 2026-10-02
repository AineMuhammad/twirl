import { useMemo } from 'react';
import { Object3D, Vector3 } from 'three';

import type { Stage } from '../internal/stage';

export interface KeyLightProps {
  stage: Stage;
  /** Direction from the model toward the light (need not be normalized). */
  direction: readonly [number, number, number];
  color: string;
  intensity: number;
  shadows: boolean;
  shadowMapSize: number;
}

/** The directional light that casts the model's shadow, with a shadow camera fitted to it. */
export function KeyLight({
  stage,
  direction,
  color,
  intensity,
  shadows,
  shadowMapSize,
}: KeyLightProps) {
  const { center, radius } = stage;
  const [dx, dy, dz] = direction;
  const position = useMemo(
    () =>
      new Vector3(dx, dy, dz)
        .normalize()
        .multiplyScalar(radius * 4)
        .add(new Vector3(...center))
        .toArray(),
    [dx, dy, dz, radius, center],
  );
  // The light must aim at the model; its target has to be in the scene graph to update.
  const target = useMemo(() => new Object3D(), []);
  const extent = radius * 1.6;

  return (
    <>
      <primitive object={target} position={center} />
      <directionalLight
        // Remount when the map size changes: three only allocates the shadow map once.
        key={shadowMapSize}
        target={target}
        position={position}
        color={color}
        intensity={intensity}
        castShadow={shadows}
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-bias={-0.0002}
        shadow-normalBias={radius * 0.01}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[-extent, extent, extent, -extent, radius * 0.1, radius * 8]}
        />
      </directionalLight>
    </>
  );
}
