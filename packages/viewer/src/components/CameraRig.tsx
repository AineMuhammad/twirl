import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { type ComponentRef, useEffect, useLayoutEffect, useRef } from 'react';
import type { PerspectiveCamera } from 'three';

import type { Framing } from '../internal/framing';
import { INTRO_SECONDS, introPosition } from '../internal/intro';
import { prefersReducedMotion } from '../internal/motion';

export interface CameraRigProps {
  /** Where to put the camera. `null` keeps the current view (e.g. nothing loaded yet). */
  framing: Framing | null;
  enablePan: boolean;
  /** Max angle from straight up, in radians. Below π/2 keeps the camera above the floor. */
  maxPolarAngle: number;
  /** Glide the camera in when a model is framed (skipped for reduced motion). */
  intro?: boolean;
}

/**
 * Orbit, zoom and touch controls, plus camera placement when a model loads.
 * Touch: one finger rotates, pinch zooms, two fingers pan (when enabled).
 */
export function CameraRig({ framing, enablePan, maxPolarAngle, intro = true }: CameraRigProps) {
  // Read the camera from the store when applying, rather than mutating a hook return value.
  const getState = useThree((state) => state.get);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  /** Seconds elapsed in the current intro, or null when none is running. */
  const introTime = useRef<number | null>(null);

  // Layout effect so the first rendered frame already uses the new framing.
  useLayoutEffect(() => {
    if (!framing) return;
    const camera = getState().camera as PerspectiveCamera;
    const animate = intro && !prefersReducedMotion();
    introTime.current = animate ? 0 : null;
    camera.position.fromArray(
      animate ? introPosition(framing.target, framing.position, 0) : framing.position,
    );
    camera.near = framing.near;
    camera.far = framing.far;
    camera.updateProjectionMatrix();
    controls.current?.target.fromArray(framing.target);
    controls.current?.update();
  }, [getState, framing, intro]);

  // Any user interaction ends the intro immediately.
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const stop = () => {
      introTime.current = null;
    };
    c.addEventListener('start', stop);
    return () => c.removeEventListener('start', stop);
  }, []);

  useFrame((_, delta) => {
    if (introTime.current === null || !framing) return;
    introTime.current = Math.min(INTRO_SECONDS, introTime.current + delta);
    const t = introTime.current / INTRO_SECONDS;
    getState().camera.position.fromArray(introPosition(framing.target, framing.position, t));
    controls.current?.update();
    if (t >= 1) introTime.current = null;
  });

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
