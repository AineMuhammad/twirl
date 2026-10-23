import { ContactShadows } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import type { Group, Mesh, MeshBasicMaterial } from 'three';

import { prefersReducedMotion } from '../internal/motion';
import type { Stage } from '../internal/stage';

const OPACITY = 0.6;
/** Fade-in after the model settles, so the shadow doesn't pop in. */
const FADE_SECONDS = 0.5;

export interface SoftShadowProps {
  stage: Stage;
}

/** Sets the shadow plane's opacity (ContactShadows exposes no prop we can animate cheaply). */
function setOpacity(group: Group, opacity: number) {
  group.traverse((object) => {
    const material = (object as Mesh).material as MeshBasicMaterial | undefined;
    if (material && 'opacity' in material) material.opacity = opacity;
  });
}

/**
 * A soft, blurred contact shadow right under the product, like a studio photo. It's a depth
 * render of the whole model, done once; remount it (via `key`) when the model's shape changes,
 * e.g. a part is hidden. The viewer only mounts it once built-in animations have settled: parts
 * in motion start outside its area and would show sliced, plane-like shadows.
 */
export function SoftShadow({ stage }: SoftShadowProps) {
  const { center, radius, floorY } = stage;
  const group = useRef<Group>(null);
  // Reduced motion: no fade, full opacity from the start.
  const [instant] = useState(prefersReducedMotion);
  const shown = useRef(instant ? FADE_SECONDS : 0);

  useFrame((_, delta) => {
    if (!group.current || shown.current >= FADE_SECONDS) return;
    shown.current = Math.min(FADE_SECONDS, shown.current + delta);
    setOpacity(group.current, (OPACITY * shown.current) / FADE_SECONDS);
  });

  return (
    <ContactShadows
      ref={group}
      position={[center[0], floorY + radius * 0.002, center[2]]}
      scale={radius * 3.2}
      far={radius * 1.2}
      blur={2.4}
      opacity={instant ? OPACITY : 0}
      resolution={512}
      frames={1}
      color="#1f160e"
    />
  );
}
