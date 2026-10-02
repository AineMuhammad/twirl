import { OrbitControls } from '@react-three/drei';

export interface CameraControlsProps {
  enablePan: boolean;
  minDistance: number;
  maxDistance: number;
  /** Max angle from straight up, in radians. Below π/2 keeps the camera above the floor. */
  maxPolarAngle: number;
}

/**
 * Orbit, zoom and touch controls. Touch: one finger rotates, pinch zooms, two fingers pan
 * (when enabled). Damping gives the smooth "weight" shoppers expect.
 */
export function CameraControls({
  enablePan,
  minDistance,
  maxDistance,
  maxPolarAngle,
}: CameraControlsProps) {
  return (
    <OrbitControls
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan={enablePan}
      minDistance={minDistance}
      maxDistance={maxDistance}
      maxPolarAngle={maxPolarAngle}
      rotateSpeed={0.8}
      zoomSpeed={0.9}
    />
  );
}
