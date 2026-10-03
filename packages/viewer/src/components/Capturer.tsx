import { useThree } from '@react-three/fiber';
import { type RefObject, useImperativeHandle } from 'react';

import { capturePixelRatio } from '../internal/capture';

export interface CaptureOptions {
  /** Multiple of the current resolution (default 2). */
  scale?: number;
  /** Longest side in pixels (default 3000), so phones don't run out of memory. */
  maxSize?: number;
}

export interface CapturerController {
  /** Re-renders the current view at a higher resolution and returns a copy of the pixels. */
  capture: (options?: CaptureOptions) => HTMLCanvasElement;
}

/** Lives inside the Canvas to reach the renderer, scene and camera. */
export function Capturer({
  controllerRef,
}: {
  controllerRef: RefObject<CapturerController | null>;
}) {
  const get = useThree((state) => state.get);
  useImperativeHandle(
    controllerRef,
    () => ({
      capture: ({ scale, maxSize } = {}) => {
        const { gl, scene, camera, size } = get();
        const previous = gl.getPixelRatio();
        gl.setPixelRatio(capturePixelRatio(previous, size, scale, maxSize));
        try {
          gl.render(scene, camera);
          // Copy right away: the drawing buffer isn't preserved after this task.
          const copy = document.createElement('canvas');
          copy.width = gl.domElement.width;
          copy.height = gl.domElement.height;
          copy.getContext('2d')?.drawImage(gl.domElement, 0, 0);
          return copy;
        } finally {
          gl.setPixelRatio(previous);
        }
      },
    }),
    [get],
  );
  return null;
}
