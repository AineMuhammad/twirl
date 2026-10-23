import { Environment, Lightformer } from '@react-three/drei';
import { useLayoutEffect, useMemo } from 'react';
import { Object3D, Vector3 } from 'three';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';

import { kelvinToColor, type RoomAnchors } from '../internal/room';
import type { RoomMood } from '../types';

type Vec3 = [number, number, number];

export interface RoomLightingProps {
  anchors: RoomAnchors;
  /** Room-space → world offset (the room is moved so its product spot is under the product). */
  offset: Vec3;
  mood: RoomMood;
  shadowMapSize: number;
}

// Area lights need their lookup tables set up once per page.
let rectAreaReady = false;
function ensureRectAreaLights() {
  if (rectAreaReady) return;
  RectAreaLightUniformsLib.init();
  rectAreaReady = true;
}

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/** A light's aim point, as an object the light can track. */
function useTarget(position: Vec3) {
  const target = useMemo(() => new Object3D(), []);
  useLayoutEffect(() => {
    target.position.set(...position);
    target.updateMatrixWorld();
  }, [target, position]);
  return target;
}

function Sun({
  position,
  target,
  shadowMapSize,
}: {
  position: Vec3;
  target: Vec3;
  shadowMapSize: number;
}) {
  const aim = useTarget(target);
  // A sun is parallel light: keep its direction, place it far enough to cover the living area.
  const from = useMemo(() => {
    const dir = new Vector3(...position).sub(new Vector3(...target)).normalize();
    return new Vector3(...target).addScaledVector(dir, 9).toArray();
  }, [position, target]);
  return (
    <>
      <primitive object={aim} />
      <directionalLight
        key={shadowMapSize}
        position={from}
        target={aim}
        color={kelvinToColor(4800)}
        intensity={3.2}
        castShadow
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      >
        <orthographicCamera attach="shadow-camera" args={[-4.5, 4.5, 4.5, -4.5, 0.5, 20]} />
      </directionalLight>
    </>
  );
}

function Skylight({
  position,
  target,
  width,
  height,
  intensity,
}: {
  position: Vec3;
  target: Vec3;
  width: number;
  height: number;
  intensity: number;
}) {
  ensureRectAreaLights();
  const lookAt = useMemo(() => new Vector3(...target), [target]);
  return (
    <rectAreaLight
      position={position}
      width={width}
      height={height}
      color={kelvinToColor(7000)}
      intensity={intensity}
      ref={(light) => light?.lookAt(lookAt)}
    />
  );
}

function Downlight({ position, target }: { position: Vec3; target: Vec3 }) {
  const aim = useTarget(target);
  return (
    <>
      <primitive object={aim} />
      <spotLight
        position={position}
        target={aim}
        color={kelvinToColor(5000)}
        intensity={13}
        angle={0.7}
        penumbra={0.85}
        decay={2}
        distance={8}
      />
    </>
  );
}

/**
 * Lighting for a room scene, placed from its anchors: by day a sun through the window (the only
 * shadow caster), skylight at the window and the sconces glowing softly; by night downlights,
 * sconces and the pendant. Image-based light from a soft room-like environment fills the rest.
 */
export function RoomLighting({ anchors, offset, mood, shadowMapSize }: RoomLightingProps) {
  const at = (p: Vec3) => add(p, offset);
  const day = mood === 'day';
  // Warm white, not amber: night should read as lamplight, not an orange cast.
  const bulb = kelvinToColor(3800);
  const sconceIntensity = day ? 0.6 : 2.4;

  return (
    <>
      <Environment key={mood} frames={1} resolution={128} environmentIntensity={day ? 0.55 : 0.18}>
        <color attach="background" args={[day ? '#c9c2b8' : '#25262a']} />
        {/* Bright window side and warm walls: reflections and soft fill read as this room. */}
        <Lightformer
          form="rect"
          color={day ? '#eef3ff' : '#1d2a44'}
          intensity={day ? 3 : 0.6}
          position={[-8, 3, 0]}
          scale={[6, 4, 1]}
          target={[0, 1, 0]}
        />
        <Lightformer
          form="rect"
          color={day ? '#fff4e6' : '#f2f2f0'}
          intensity={day ? 1.2 : 0.5}
          position={[0, 6, 0]}
          scale={[10, 10, 1]}
          target={[0, 0, 0]}
        />
        <Lightformer
          form="rect"
          color={day ? '#e9dccb' : '#d8d8d6'}
          intensity={day ? 0.8 : 0.3}
          position={[8, 2, 0]}
          scale={[8, 4, 1]}
          target={[0, 1, 0]}
        />
      </Environment>
      <hemisphereLight args={day ? ['#e3ebf5', '#b49b7c', 0.9] : ['#7a8294', '#5a5856', 0.5]} />

      {day && anchors.sun && (
        <Sun
          position={at(anchors.sun.position)}
          target={at(anchors.sun.target)}
          shadowMapSize={shadowMapSize}
        />
      )}
      {day && anchors.window && (
        <Skylight
          position={at(anchors.window.position)}
          target={at(anchors.window.target)}
          width={anchors.window.width}
          height={anchors.window.height}
          intensity={6}
        />
      )}
      {!day &&
        anchors.downlights.map((d, i) => (
          <Downlight key={i} position={at(d.position)} target={at(d.target)} />
        ))}
      {anchors.sconces.map((p, i) => (
        <pointLight
          key={i}
          position={at(p)}
          color={bulb}
          intensity={sconceIntensity}
          decay={2}
          distance={5}
        />
      ))}
      {anchors.pendant && (
        <pointLight
          position={at(anchors.pendant)}
          color={kelvinToColor(3800)}
          intensity={day ? 1 : 4}
          decay={2}
          distance={6}
        />
      )}
    </>
  );
}
