import { useEffect, useMemo } from 'react';
import { BackSide, LatheGeometry, Vector2 } from 'three';

import { cycloramaProfile, cycloramaSize } from '../internal/cyclorama';
import type { Stage } from '../internal/stage';

/**
 * A photo-studio "infinity cove" around the product: the floor curves up into a wall all round,
 * so it works from every orbit angle. Lit by the scene's lights and receiving its shadows, it
 * gives the soft floor-to-wall gradient of a real studio.
 */
export function Cyclorama({ stage, color }: { stage: Stage; color: string }) {
  const geometry = useMemo(() => {
    const profile = cycloramaProfile(cycloramaSize(stage.radius));
    return new LatheGeometry(
      profile.map(([x, y]) => new Vector2(x, y)),
      96,
    );
  }, [stage.radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh
      geometry={geometry}
      // Just below the model's base so the contact shadow and model sit on it cleanly.
      position={[stage.center[0], stage.floorY - stage.radius * 0.004, stage.center[2]]}
      receiveShadow
    >
      {/* Seen from inside the bowl: render the inner faces. */}
      <meshStandardMaterial color={color} roughness={0.95} metalness={0} side={BackSide} />
    </mesh>
  );
}
