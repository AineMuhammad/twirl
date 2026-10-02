import { Environment, Lightformer } from '@react-three/drei';

import { LIGHTING_RIGS } from '../internal/lighting-presets';
import type { Stage } from '../internal/stage';
import type { LightingPreset } from '../scene';
import { KeyLight } from './KeyLight';

/** Scale of the virtual "room" the environment panels sit in. */
const ENV_ROOM = 5;

export interface LightingProps {
  preset: LightingPreset;
  stage: Stage;
  shadows: boolean;
  shadowMapSize: number;
}

/** Procedural lighting: an environment built from Lightformer panels plus key and fill lights. */
export function Lighting({ preset, stage, shadows, shadowMapSize }: LightingProps) {
  const rig = LIGHTING_RIGS[preset];

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

      <KeyLight
        stage={stage}
        direction={rig.key.direction}
        color={rig.key.color}
        intensity={rig.key.intensity}
        shadows={shadows}
        shadowMapSize={shadowMapSize}
      />
    </>
  );
}
