import { Canvas } from '@react-three/fiber';
import {
  type CSSProperties,
  type Ref,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { type Box3, NeutralToneMapping, type WebGLRendererParameters } from 'three';

import { AdaptiveQuality } from './components/AdaptiveQuality';
import { CameraRig, type CameraRigController } from './components/CameraRig';
import { Cyclorama } from './components/Cyclorama';
import { EnvironmentIndicator } from './components/EnvironmentIndicator';
import { Floor } from './components/Floor';
import { SceneLighting } from './components/SceneLighting';
import { SoftShadow } from './components/SoftShadow';
import { LoadingOverlay, type OverlayState } from './components/LoadingOverlay';
import { Model, type ModelController } from './components/Model';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  DEFAULT_ENVIRONMENT_SOURCES,
  type EnvironmentSources,
  pickEnvironmentResolution,
} from './environments';
import { dprRange, readDeviceHints } from './internal/device';
import { effectsEnabled, type EffectsSetting } from './internal/effects';
import { progressFromEvent, toViewerError } from './internal/errors';
import { cycloramaColor } from './internal/cyclorama';
import { floorColorFor } from './internal/floor-color';
import type { CameraView } from './internal/views';
import { computeFraming, type Framing } from './internal/framing';
import { qualitySettings } from './internal/quality';
import { type Stage, stageFromBounds } from './internal/stage';
import { backgroundCss, DEFAULT_SCENE, type SceneSettings } from './scene';
import {
  DEFAULT_DECODER_PATHS,
  type DecoderPaths,
  type EnvironmentStatus,
  type MeshOverrides,
  type ModelInfo,
  type ViewerError,
} from './types';

/** Imperative controls, via `ref`. */
export interface ViewerHandle {
  /** Restart the model's built-in animations from the beginning. No-op if it has none. */
  replayAnimations: () => void;
  /** Glide the camera to a preset view of the current model. */
  setView: (view: CameraView) => void;
}

export interface ViewerProps {
  ref?: Ref<ViewerHandle>;
  /** GLB/glTF URL (http(s) or blob:). `null` renders an empty stage. */
  modelUrl: string | null;
  /**
   * Per-mesh appearance, keyed by `MeshTreeNode.id` from `onLoad`. Pass a stable object
   * (memoize it); a new object re-applies every override.
   */
  meshOverrides?: MeshOverrides;
  /** Outline this node (e.g. while hovering it in a mesh tree). */
  highlightedMeshId?: string | null;
  /**
   * Called when the shopper clicks/taps a mesh (`null` when they click empty space).
   * Drags are orbiting, not selection. Omit to disable picking entirely.
   */
  onMeshSelect?: (id: string | null) => void;
  /**
   * Where HDRI environments are served from: base URLs ending in `/` for `1k` (default
   * `/hdri/1k/`) and optionally `2k`, used on large viewers for sharper reflections.
   */
  environmentSources?: Partial<EnvironmentSources>;
  /** Background, lighting, floor and shadows. Missing fields use `DEFAULT_SCENE`. */
  scene?: Partial<SceneSettings>;
  /** Where decoder files are served from. Defaults to `/decoders/draco/` and `/decoders/basis/`. */
  decoderPaths?: Partial<DecoderPaths>;
  /**
   * Post-processing (ambient occlusion, bloom). 'auto' (default) enables it on mouse/trackpad
   * devices while the frame rate is healthy.
   */
  effects?: EffectsSetting;
  /**
   * Slowly turn the product after a few seconds without interaction, like a turntable.
   * Defaults to true; disabled for users who prefer reduced motion.
   */
  idleRotate?: boolean;
  /** Camera view the model opens on (after the intro). Defaults to the automatic framing. */
  initialView?: CameraView;
  /** Allow two-finger / right-drag panning. Off by default so shoppers can't lose the product. */
  enablePan?: boolean;
  /**
   * Play the model's built-in animations once when it loads, holding the last frame.
   * Defaults to true. Users who prefer reduced motion see the final pose immediately.
   */
  playAnimationsOnLoad?: boolean;
  onLoad?: (info: ModelInfo) => void;
  /**
   * HDRI loading state. The viewer shows its own "Loading lighting…" indicator; use this to
   * reflect it elsewhere (e.g. a spinner on the chosen lighting option).
   */
  onEnvironmentStatus?: (status: EnvironmentStatus) => void;
  /** Called with a friendly message and the original error (for logging). */
  onError?: (error: ViewerError) => void;
  className?: string;
  style?: CSSProperties;
}

const CAMERA_FOV = 35;
// Post-processing is a separate chunk, fetched only when enabled.
const Effects = lazy(() => import('./components/Effects'));

/**
 * Khronos PBR Neutral tone mapping: designed for product rendering, it keeps base colors true
 * (a picked color looks like that color) where ACES darkens and desaturates them.
 */
const GL: Partial<WebGLRendererParameters> & { toneMapping: number; toneMappingExposure: number } =
  {
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: false,
    toneMapping: NeutralToneMapping,
    toneMappingExposure: 1,
  };
const NO_OVERRIDES: MeshOverrides = {};
const DEFAULT_STAGE: Stage = { center: [0, 0, 0], radius: 1, floorY: 0 };

const rootStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  // Let the canvas own touch gestures instead of the page scrolling or zooming.
  touchAction: 'none',
};

interface Placement {
  url: string;
  framing: Framing;
  stage: Stage;
}

export function Viewer({
  ref,
  modelUrl,
  meshOverrides = NO_OVERRIDES,
  highlightedMeshId = null,
  onMeshSelect,
  scene: sceneOverrides,
  environmentSources,
  decoderPaths,
  enablePan = false,
  initialView,
  effects = 'auto',
  idleRotate = true,
  playAnimationsOnLoad = true,
  onLoad,
  onEnvironmentStatus,
  onError,
  className,
  style,
}: ViewerProps) {
  const device = useMemo(
    () => readDeviceHints(typeof window === 'undefined' ? undefined : window),
    [],
  );
  const maxDpr = useMemo(() => dprRange(device)[1], [device]);
  const [qualityFactor, setQualityFactor] = useState(1);
  const quality = qualitySettings(qualityFactor, device.coarsePointer, maxDpr);

  const scene: SceneSettings = { ...DEFAULT_SCENE, ...sceneOverrides };
  const sources1k = environmentSources?.['1k'] ?? DEFAULT_ENVIRONMENT_SOURCES['1k'];
  const sources2k = environmentSources?.['2k'];
  const sources = useMemo<EnvironmentSources>(
    () => (sources2k ? { '1k': sources1k, '2k': sources2k } : { '1k': sources1k }),
    [sources1k, sources2k],
  );
  const dracoPath = decoderPaths?.draco ?? DEFAULT_DECODER_PATHS.draco;
  const basisPath = decoderPaths?.basis ?? DEFAULT_DECODER_PATHS.basis;
  const decoders = useMemo(() => ({ draco: dracoPath, basis: basisPath }), [dracoPath, basisPath]);

  const modelController = useRef<ModelController | null>(null);
  const rigController = useRef<CameraRigController | null>(null);
  useImperativeHandle(
    ref,
    () => ({
      replayAnimations: () => modelController.current?.replayAnimations(),
      setView: (view) => rigController.current?.goTo(view),
    }),
    [],
  );

  const container = useRef<HTMLDivElement>(null);
  // Physical width of the viewer, to decide whether HDRIs are worth loading at 2k.
  const [physicalWidth, setPhysicalWidth] = useState(0);
  useEffect(() => {
    const element = container.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setPhysicalWidth(Math.round(entry.contentRect.width * device.devicePixelRatio));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [device.devicePixelRatio]);
  const resolution = pickEnvironmentResolution({
    physicalWidth,
    has2k: Boolean(sources['2k']),
  });
  const [placement, setPlacement] = useState<Placement | null>(null);
  const current = placement?.url === modelUrl ? placement : null;

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
  // The latest onLoad, read when a model loads: an inline callback must not re-run loading
  // (which would re-frame the camera on every parent render).
  const onLoadRef = useRef(onLoad);
  useLayoutEffect(() => {
    onLoadRef.current = onLoad;
  }, [onLoad]);
  const handleLoaded = useCallback(
    (info: ModelInfo, bounds: Box3) => {
      if (modelUrl) {
        const rect = container.current?.getBoundingClientRect();
        const aspect = rect && rect.height > 0 ? rect.width / rect.height : 1;
        const framing = computeFraming(bounds, { fov: CAMERA_FOV, aspect });
        setPlacement({ url: modelUrl, framing, stage: stageFromBounds(bounds, framing.radius) });
      }
      setOverlay({ url: modelUrl, state: { phase: 'ready' } });
      onLoadRef.current?.(info);
    },
    [modelUrl],
  );
  const handleError = useCallback(
    (cause: unknown) => {
      const error = toViewerError(cause);
      setOverlay({ url: modelUrl, state: { phase: 'error', error } });
      onError?.(error);
    },
    [modelUrl, onError],
  );

  const stage = current?.stage ?? DEFAULT_STAGE;

  // Soft shadows re-render only while the model moves, or once after its shape changes.
  const [animating, setAnimating] = useState(false);
  const hiddenSignature = Object.entries(meshOverrides)
    .filter(([, o]) => o.visible === false)
    .map(([id]) => id)
    .sort()
    .join(',');

  const [environmentStatus, setEnvironmentStatus] = useState<EnvironmentStatus>('ready');
  const handleEnvironmentStatus = useCallback(
    (status: EnvironmentStatus) => {
      setEnvironmentStatus(status);
      onEnvironmentStatus?.(status);
    },
    [onEnvironmentStatus],
  );

  return (
    <div
      ref={container}
      className={className}
      style={{ ...rootStyle, background: backgroundCss(scene.background), ...style }}
      data-twirl-viewer=""
    >
      <Canvas
        dpr={quality.dpr}
        shadows="percentage"
        camera={{ fov: CAMERA_FOV, near: 0.01, far: 1000, position: [3, 2, 5] }}
        gl={GL}
      >
        <AdaptiveQuality onChange={setQualityFactor} />
        <SceneLighting
          scene={scene}
          stage={stage}
          shadowMapSize={quality.shadowMapSize}
          sources={sources}
          resolution={resolution}
          onStatus={handleEnvironmentStatus}
        />
        {modelUrl && (
          <ErrorBoundary key={modelUrl} onError={handleError}>
            <Suspense fallback={null}>
              <Model
                url={modelUrl}
                decoders={decoders}
                playAnimationsOnLoad={playAnimationsOnLoad}
                meshOverrides={meshOverrides}
                highlightedMeshId={highlightedMeshId}
                onMeshSelect={onMeshSelect}
                controllerRef={modelController}
                onProgress={handleProgress}
                onLoaded={handleLoaded}
                onAnimatingChange={setAnimating}
              />
            </Suspense>
          </ErrorBoundary>
        )}
        {current && scene.cyclorama && (
          <Cyclorama stage={stage} color={cycloramaColor(scene.background)} />
        )}
        {current && scene.shadows && (
          <SoftShadow
            key={`${current.url}|${hiddenSignature}|${animating}`}
            stage={stage}
            live={animating}
          />
        )}
        {current && !scene.cyclorama && (
          // The cyclorama is the floor (and shadow catcher) when it's on.
          <Floor
            stage={stage}
            color={floorColorFor(scene.background)}
            visible={scene.floor}
            shadows={scene.shadows}
          />
        )}
        {current && effectsEnabled(effects, device.coarsePointer, qualityFactor) && (
          <Suspense fallback={null}>
            <Effects stage={stage} />
          </Suspense>
        )}
        <CameraRig
          framing={current?.framing ?? null}
          enablePan={enablePan}
          maxPolarAngle={Math.PI / 2 - 0.05}
          idleRotate={idleRotate}
          initialView={initialView}
          controllerRef={rigController}
        />
      </Canvas>
      <LoadingOverlay state={overlayState} />
      {environmentStatus === 'loading' && overlayState.phase !== 'loading' && (
        <EnvironmentIndicator />
      )}
    </div>
  );
}
