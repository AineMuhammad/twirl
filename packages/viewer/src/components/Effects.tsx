import { Bloom, EffectComposer, N8AO, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';

import type { Stage } from '../internal/stage';

/**
 * Photographic post-processing: ambient occlusion (contact darkening in seams and crevices), a
 * subtle bloom on the brightest highlights, then PBR Neutral tone mapping (the composer replaces
 * the renderer's own). Loaded lazily and only where the device can afford it.
 */
export default function Effects({ stage }: { stage: Stage }) {
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <N8AO
        // aoRadius is in world units (scaled to the model); distanceFalloff is a ratio of it.
        aoRadius={stage.radius * 0.5}
        distanceFalloff={1}
        intensity={3.2}
        quality="medium"
        halfRes
        depthAwareUpsampling
      />
      <Bloom luminanceThreshold={0.92} luminanceSmoothing={0.15} intensity={0.25} mipmapBlur />
      <ToneMapping mode={ToneMappingMode.NEUTRAL} />
    </EffectComposer>
  );
}
