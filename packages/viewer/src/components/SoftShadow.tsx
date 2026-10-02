import { ContactShadows } from '@react-three/drei';

import type { Stage } from '../internal/stage';

export interface SoftShadowProps {
  stage: Stage;
  /** Re-render every frame (while the model animates); otherwise render once. */
  live: boolean;
}

/**
 * A soft, blurred contact shadow right under the product, like a studio photo. It's a depth
 * render of the whole model, so it only updates while something moves; remount it (via `key`)
 * when the model's shape changes, e.g. a part is hidden.
 */
export function SoftShadow({ stage, live }: SoftShadowProps) {
  const { center, radius, floorY } = stage;
  return (
    <ContactShadows
      position={[center[0], floorY + radius * 0.002, center[2]]}
      scale={radius * 3.2}
      far={radius * 1.2}
      blur={2.4}
      opacity={0.6}
      resolution={512}
      frames={live ? Infinity : 1}
      color="#1f160e"
    />
  );
}
