import { Canvas } from '@react-three/fiber';
import type { Box3 } from 'three';
import {
  type CSSProperties,
  type Ref,
  Suspense,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import { CameraRig } from './components/CameraRig';
import { LoadingOverlay, type OverlayState } from './components/LoadingOverlay';
import { Model, type ModelController } from './components/Model';
import { ModelErrorBoundary } from './components/ModelErrorBoundary';
import { dprRange, readDeviceHints } from './internal/device';
import { progressFromEvent, toViewerError } from './internal/errors';
import { computeFraming, type Framing } from './internal/framing';
import {
  DEFAULT_DECODER_PATHS,
  type DecoderPaths,
  type ModelInfo,
  type ViewerError,
} from './types';

/** Imperative controls, via `ref`. */
export interface ViewerHandle {
  /** Restart the model's built-in animations from the beginning. No-op if it has none. */
  replayAnimations: () => void;
}

export interface ViewerProps {
  ref?: Ref<ViewerHandle>;
  /** GLB/glTF URL (http(s) or blob:). `null` renders an empty stage. */
  modelUrl: string | null;
  /** Where decoder files are served from. Defaults to `/decoders/draco/` and `/decoders/basis/`. */
  decoderPaths?: Partial<DecoderPaths>;
  /** Allow two-finger / right-drag panning. Off by default so shoppers can't lose the product. */
  enablePan?: boolean;
  /**
   * Play the model's built-in animations once when it loads, holding the last frame.
   * Defaults to true. Users who prefer reduced motion see the final pose immediately.
   */
  playAnimationsOnLoad?: boolean;
  onLoad?: (info: ModelInfo) => void;
  /** Called with a friendly message and the original error (for logging). */
  onError?: (error: ViewerError) => void;
  className?: string;
  style?: CSSProperties;
}

const CAMERA_FOV = 35;

const rootStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  // Let the canvas own touch gestures instead of the page scrolling or zooming.
  touchAction: 'none',
};

export function Viewer({
  ref,
  modelUrl,
  decoderPaths,
  enablePan = false,
  playAnimationsOnLoad = true,
  onLoad,
  onError,
  className,
  style,
}: ViewerProps) {
  const dpr = useMemo(
    () => dprRange(readDeviceHints(typeof window === 'undefined' ? undefined : window)),
    [],
  );
  const dracoPath = decoderPaths?.draco ?? DEFAULT_DECODER_PATHS.draco;
  const basisPath = decoderPaths?.basis ?? DEFAULT_DECODER_PATHS.basis;
  const decoders = useMemo(() => ({ draco: dracoPath, basis: basisPath }), [dracoPath, basisPath]);

  const modelController = useRef<ModelController | null>(null);
  useImperativeHandle(
    ref,
    () => ({ replayAnimations: () => modelController.current?.replayAnimations() }),
    [],
  );

  const container = useRef<HTMLDivElement>(null);
  const [framing, setFraming] = useState<{ url: string; framing: Framing } | null>(null);

  // Overlay state is keyed by URL so a new model starts in "loading" without an extra effect.
  const [overlay, setOverlay] = useState<{ url: string | null; state: OverlayState }>({
    url: null,
    state: { phase: 'idle' },
  });
  const overlayState: OverlayState =
    overlay.url === modelUrl
      ? overlay.state
      : modelUrl
        ? { phase: 'loading', progress: { fraction: null, loadedBytes: 0 } }
        : { phase: 'idle' };

  const handleProgress = useCallback(
    (event: ProgressEvent) =>
      setOverlay({
        url: modelUrl,
        state: { phase: 'loading', progress: progressFromEvent(event) },
      }),
    [modelUrl],
  );
  const handleLoaded = useCallback(
    (info: ModelInfo, bounds: Box3) => {
      if (modelUrl) {
        const rect = container.current?.getBoundingClientRect();
        const aspect = rect && rect.height > 0 ? rect.width / rect.height : 1;
        setFraming({ url: modelUrl, framing: computeFraming(bounds, { fov: CAMERA_FOV, aspect }) });
      }
      setOverlay({ url: modelUrl, state: { phase: 'ready' } });
      onLoad?.(info);
    },
    [modelUrl, onLoad],
  );
  const handleError = useCallback(
    (cause: unknown) => {
      const error = toViewerError(cause);
      setOverlay({ url: modelUrl, state: { phase: 'error', error } });
      onError?.(error);
    },
    [modelUrl, onError],
  );

  return (
    <div
      ref={container}
      className={className}
      style={{ ...rootStyle, ...style }}
      data-twirl-viewer=""
    >
      <Canvas
        dpr={dpr}
        camera={{ fov: CAMERA_FOV, near: 0.01, far: 1000, position: [3, 2, 5] }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 5, 4]} intensity={1.5} />
        {modelUrl && (
          <ModelErrorBoundary key={modelUrl} onError={handleError}>
            <Suspense fallback={null}>
              <Model
                url={modelUrl}
                decoders={decoders}
                playAnimationsOnLoad={playAnimationsOnLoad}
                controllerRef={modelController}
                onProgress={handleProgress}
                onLoaded={handleLoaded}
              />
            </Suspense>
          </ModelErrorBoundary>
        )}
        <CameraRig
          framing={framing?.url === modelUrl ? framing.framing : null}
          enablePan={enablePan}
          maxPolarAngle={Math.PI / 2 - 0.05}
        />
      </Canvas>
      <LoadingOverlay state={overlayState} />
    </div>
  );
}
