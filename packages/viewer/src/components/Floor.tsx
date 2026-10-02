import { useEffect, useMemo } from 'react';
import { CanvasTexture } from 'three';

import type { Stage } from '../internal/stage';

export interface FloorProps {
  stage: Stage;
  color: string;
  /** Show the floor surface. */
  visible: boolean;
  /** Receive the model's shadow (with or without a visible floor). */
  shadows: boolean;
}

/** Radial white→black texture used as an alpha map so the floor fades out instead of ending. */
function createFadeTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    // Smoothstep-shaped falloff: fewer visible steps than a linear ramp.
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const edge = Math.min(1, Math.max(0, (t - 0.35) / 0.65));
      const alpha = 1 - edge * edge * (3 - 2 * edge);
      const v = Math.round(alpha * 255);
      gradient.addColorStop(t, `rgb(${v}, ${v}, ${v})`);
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  return new CanvasTexture(canvas);
}

export function Floor({ stage, color, visible, shadows }: FloorProps) {
  const fade = useMemo(() => createFadeTexture(), []);
  useEffect(() => () => fade.dispose(), [fade]);

  if (!visible && !shadows) return null;

  // Slightly below the model's lowest point to avoid z-fighting with its base.
  const y = stage.floorY - stage.radius * 0.002;
  const size = stage.radius * 6;

  return (
    <mesh
      position={[stage.center[0], y, stage.center[2]]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow={shadows}
    >
      <circleGeometry args={[size / 2, 64]} />
      {visible ? (
        <meshStandardMaterial
          color={color}
          roughness={1}
          metalness={0}
          alphaMap={fade}
          transparent
          depthWrite={false}
          dithering
        />
      ) : (
        <shadowMaterial opacity={0.22} transparent depthWrite={false} />
      )}
    </mesh>
  );
}
