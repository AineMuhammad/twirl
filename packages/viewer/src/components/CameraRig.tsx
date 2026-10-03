import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import {
  type ComponentRef,
  type RefObject,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from 'react';
import type { PerspectiveCamera } from 'three';

import type { Framing } from '../internal/framing';
import { INTRO_SECONDS, introPosition } from '../internal/intro';
import { prefersReducedMotion } from '../internal/motion';
import {
  azimuthOf,
  type CameraView,
  glidePosition,
  VIEW_GLIDE_SECONDS,
  viewPosition,
} from '../internal/views';

export interface CameraRigController {
  /** Glide to a named view (jumps for reduced motion). */
  goTo: (view: CameraView) => void;
  /** The camera's current angle around the model, in degrees (0 = +Z). */
  azimuth: () => number | null;
}

export interface CameraRigProps {
  /** Where to put the camera. `null` keeps the current view (e.g. nothing loaded yet). */
  framing: Framing | null;
  enablePan: boolean;
  /** Max angle from straight up, in radians. Below π/2 keeps the camera above the floor. */
  maxPolarAngle: number;
  /** Glide the camera in when a model is framed (skipped for reduced motion). */
  intro?: boolean;
  /** Where the camera settles when a model is framed. Defaults to the framing's own position. */
  initialView?: CameraView | undefined;
  /** Where the model's front faces (degrees); preset views are measured from it. */
  frontAzimuth?: number;
  /** Slowly orbit the product after a few idle seconds (skipped for reduced motion). */
  idleRotate?: boolean;
  controllerRef?: RefObject<CameraRigController | null>;
}

/** Seconds without interaction before the turntable starts. */
export const IDLE_SECONDS = 4;

/**
 * Orbit, zoom and touch controls, plus camera placement when a model loads.
 * Touch: one finger rotates, pinch zooms, two fingers pan (when enabled).
 */
export function CameraRig({
  framing,
  enablePan,
  maxPolarAngle,
  intro = true,
  initialView,
  frontAzimuth = 0,
  idleRotate = true,
  controllerRef,
}: CameraRigProps) {
  // Read the camera from the store when applying, rather than mutating a hook return value.
  const getState = useThree((state) => state.get);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  /** Seconds elapsed in the current intro, or null when none is running. */
  const introTime = useRef<number | null>(null);
  /** Where the current intro ends. */
  const introEnd = useRef<[number, number, number]>([0, 0, 0]);
  // Read at framing time only, so changing it later doesn't re-run the intro.
  const initialViewRef = useRef(initialView);
  const frontAzimuthRef = useRef(frontAzimuth);
  useLayoutEffect(() => {
    initialViewRef.current = initialView;
    frontAzimuthRef.current = frontAzimuth;
  }, [initialView, frontAzimuth]);
  /** Seconds since the last interaction (or since the model was framed). */
  const idleTime = useRef(0);
  const interacting = useRef(false);
  /** A glide between views in progress. */
  const glide = useRef<{
    from: [number, number, number];
    to: [number, number, number];
    time: number;
  } | null>(null);

  useImperativeHandle(
    controllerRef,
    () => ({
      azimuth: () => {
        if (!framing) return null;
        const target = controls.current?.target.toArray() ?? framing.target;
        return azimuthOf(target, getState().camera.position.toArray());
      },
      goTo: (view) => {
        if (!framing) return;
        const camera = getState().camera;
        const to = viewPosition(framing, view, frontAzimuth);
        introTime.current = null;
        idleTime.current = 0;
        if (prefersReducedMotion()) {
          camera.position.fromArray(to);
          controls.current?.update();
          glide.current = null;
          return;
        }
        glide.current = { from: camera.position.toArray(), to, time: 0 };
      },
    }),
    [framing, getState, frontAzimuth],
  );

  // Layout effect so the first rendered frame already uses the new framing.
  useLayoutEffect(() => {
    if (!framing) return;
    const camera = getState().camera as PerspectiveCamera;
    const animate = intro && !prefersReducedMotion();
    introTime.current = animate ? 0 : null;
    idleTime.current = 0;
    glide.current = null;
    const view = initialViewRef.current;
    const end = view ? viewPosition(framing, view, frontAzimuthRef.current) : framing.position;
    introEnd.current = end;
    camera.position.fromArray(animate ? introPosition(framing.target, end, 0) : end);
    camera.near = framing.near;
    camera.far = framing.far;
    camera.updateProjectionMatrix();
    controls.current?.target.fromArray(framing.target);
    controls.current?.update();
  }, [getState, framing, intro]);

  // Any user interaction ends the intro and the turntable, and restarts the idle timer.
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const start = () => {
      introTime.current = null;
      glide.current = null;
      interacting.current = true;
      idleTime.current = 0;
    };
    const end = () => {
      interacting.current = false;
      idleTime.current = 0;
    };
    c.addEventListener('start', start);
    c.addEventListener('end', end);
    return () => {
      c.removeEventListener('start', start);
      c.removeEventListener('end', end);
    };
  }, []);

  useFrame((_, delta) => {
    const c = controls.current;
    if (c) {
      const canRotate = idleRotate && framing !== null && !prefersReducedMotion();
      if (!interacting.current && introTime.current === null && glide.current === null) {
        idleTime.current += delta;
      }
      c.autoRotate = canRotate && !interacting.current && idleTime.current >= IDLE_SECONDS;
    }
    const g = glide.current;
    if (g && framing) {
      g.time = Math.min(VIEW_GLIDE_SECONDS, g.time + delta);
      getState().camera.position.fromArray(
        glidePosition(framing.target, g.from, g.to, g.time / VIEW_GLIDE_SECONDS),
      );
      controls.current?.update();
      if (g.time >= VIEW_GLIDE_SECONDS) glide.current = null;
      return;
    }
    if (introTime.current === null || !framing) return;
    introTime.current = Math.min(INTRO_SECONDS, introTime.current + delta);
    const t = introTime.current / INTRO_SECONDS;
    getState().camera.position.fromArray(introPosition(framing.target, introEnd.current, t));
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
      // Turntable speed when idle: about 80 s per full turn.
      autoRotateSpeed={0.75}
      zoomSpeed={0.9}
    />
  );
}
