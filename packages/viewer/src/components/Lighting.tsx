import { Environment, Lightformer } from '@react-three/drei';
import { useMemo } from 'react';
import { Object3D, Vector3 } from 'three';

import { LIGHTING_RIGS } from '../internal/lighting-presets';
import type { Stage } from '../internal/stage';
import type { LightingPreset } from '../scene';

/** Scale of the virtual "room" the environment panels sit in. */
const ENV_ROOM = 5;

export interface LightingProps {
  preset: LightingPreset;
  stage: Stage;
  shadows: boolean;
  shadowMapSize: number;
}

export function Lighting({ preset, stage, shadows, shadowMapSize }: LightingProps) {
  const rig = LIGHTING_RIGS[preset];
  const { center, radius } = stage;

  const keyPosition = useMemo(
    () =>
      new Vector3(...rig.key.direction)
        .normalize()
        .multiplyScalar(radius * 4)
        .add(new Vector3(...center))
        .toArray(),
    [rig, radius, center],
  );
  // The key light must aim at the model; its target has to be in the scene graph to update.
  const target = useMemo(() => new Object3D(), []);
  const extent = radius * 1.6;

  return (
    <>
      <Environment
        key={preset}
        frames={1}
        resolution={256}
        environmentIntensity={rig.environmentIntensity}
      >
        <color attach="background" args={[rig.environmentColor]} />
        {rig.panels.map((panel, i) => (
          <Lightformer
            key={i}
            form={panel.form}
            color={panel.color}
            intensity={panel.intensity}
            position={panel.position.map((v) => v * ENV_ROOM) as [number, number, number]}
            scale={panel.scale.map((v) => v * ENV_ROOM) as [number, number, number]}
            target={[0, 0, 0]}
          />
        ))}
      </Environment>

      <hemisphereLight
        args={[rig.hemisphere.sky, rig.hemisphere.ground, rig.hemisphere.intensity]}
      />

      <primitive object={target} position={center} />
      <directionalLight
        // Remount when the map size changes: three only allocates the shadow map once.
        key={shadowMapSize}
        target={target}
        position={keyPosition}
        color={rig.key.color}
        intensity={rig.key.intensity}
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
