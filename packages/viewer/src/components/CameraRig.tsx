import { OrbitControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { type ComponentRef, useLayoutEffect, useRef } from 'react';
import type { PerspectiveCamera } from 'three';

import type { Framing } from '../internal/framing';

export interface CameraRigProps {
  /** Where to put the camera. `null` keeps the current view (e.g. nothing loaded yet). */
  framing: Framing | null;
  enablePan: boolean;
  /** Max angle from straight up, in radians. Below π/2 keeps the camera above the floor. */
  maxPolarAngle: number;
}

/**
 * Orbit, zoom and touch controls, plus camera placement when a model loads.
 * Touch: one finger rotates, pinch zooms, two fingers pan (when enabled).
 */
export function CameraRig({ framing, enablePan, maxPolarAngle }: CameraRigProps) {
  // Read the camera from the store when applying, rather than mutating a hook return value.
  const getState = useThree((state) => state.get);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);

  // Layout effect so the first rendered frame already uses the new framing.
  useLayoutEffect(() => {
    if (!framing) return;
    const camera = getState().camera as PerspectiveCamera;
    camera.position.fromArray(framing.position);
    camera.near = framing.near;
    camera.far = framing.far;
    camera.updateProjectionMatrix();
    controls.current?.target.fromArray(framing.target);
    controls.current?.update();
  }, [getState, framing]);

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan={enablePan}
      minDistance={framing?.minDistance ?? 0.1}
      maxDistance={framing?.maxDistance ?? 100}
      maxPolarAngle={maxPolarAngle}
      rotateSpeed={0.8}
      zoomSpeed={0.9}
    />
  );
}
