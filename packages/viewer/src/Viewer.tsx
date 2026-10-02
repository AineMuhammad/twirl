import { Canvas } from '@react-three/fiber';
import { type CSSProperties, useMemo } from 'react';

import { CameraControls } from './components/CameraControls';
import { dprRange, readDeviceHints } from './internal/device';

export interface ViewerProps {
  /** Allow two-finger / right-drag panning. Off by default so shoppers can't lose the product. */
  enablePan?: boolean;
  className?: string;
  style?: CSSProperties;
}

const rootStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  // Let the canvas own touch gestures instead of the page scrolling or zooming.
  touchAction: 'none',
};

export function Viewer({ enablePan = false, className, style }: ViewerProps) {
  const dpr = useMemo(
    () => dprRange(readDeviceHints(typeof window === 'undefined' ? undefined : window)),
    [],
  );

  return (
    <div className={className} style={{ ...rootStyle, ...style }} data-twirl-viewer="">
      <Canvas
        dpr={dpr}
        camera={{ fov: 35, near: 0.01, far: 1000, position: [3, 2, 5] }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 5, 4]} intensity={1.5} />
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#9ca3af" />
        </mesh>
        <CameraControls
          enablePan={enablePan}
          minDistance={1}
          maxDistance={20}
          maxPolarAngle={Math.PI / 2 - 0.05}
        />
      </Canvas>
    </div>
  );
}
