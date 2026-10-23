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
import { type CaptureOptions, Capturer, type CapturerController } from './components/Capturer';
import { paintBackground, paintWatermark } from './internal/capture';
import { Cyclorama } from './components/Cyclorama';
import { EnvironmentIndicator } from './components/EnvironmentIndicator';
import { Floor } from './components/Floor';
import { SceneLighting } from './components/SceneLighting';
import { SoftShadow } from './components/SoftShadow';
import { LoadingOverlay, type OverlayState } from './components/LoadingOverlay';
import { Model, type ModelController } from './components/Model';
import { Room } from './components/Room';
import { RoomLoadingIndicator } from './components/RoomLoadingIndicator';
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
import type { CameraView, OrbitLimits } from './internal/views';
import { computeFraming, type Framing } from './internal/framing';
import { qualitySettings } from './internal/quality';
import { type Stage, stageFromBounds } from './internal/stage';
import { backgroundCss, DEFAULT_SCENE, type SceneSettings } from './scene';
import {
  DEFAULT_DECODER_PATHS,
  type DecoderPaths,
  type EnvironmentStatus,
  type Deformation,
  type MeshOverrides,
  type LoadProgress,
  type ModelInfo,
  type RoomSettings,
  type ViewerError,
} from './types';

/** Imperative controls, via `ref`. */
export interface ViewerHandle {
  /** Restart the model's built-in animations from the beginning. No-op if it has none. */
  replayAnimations: () => void;
  /** Glide the camera to a preset view of the current model. */
  setView: (view: CameraView) => void;
  /** The camera's current angle around the model in degrees (0 = +Z), or null before load. */
  getCameraAzimuth: () => number | null;
  /**
   * A high-resolution PNG of the current view, with the scene's backdrop behind it and an
   * optional watermark. Null before a model is shown.
   */
  captureImage: (options?: CaptureOptions & { watermark?: string }) => Promise<Blob | null>;
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
  /** Size changes (from dimension options), applied in order. Pass a stable array. */
  deformations?: readonly Deformation[];
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
  /** Where the model's front faces (degrees, 0 = +Z); preset views are measured from it. */
  frontAzimuth?: number;
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
  /**
   * Show the product in a furnished room (with the room's own day or night lighting) instead of
   * the studio backdrop. The room loads only when set.
   */
  room?: RoomSettings | null;
  className?: string;
  style?: CSSProperties;
}

const CAMERA_FOV = 35;
const veilStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
};
const ignoreQuality = () => {};
const logRoomError = (cause: unknown) => console.error('[viewer] room failed to load', cause);
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
    // A touch brighter than neutral, so products read clearly without looking over-lit.
    toneMappingExposure: 1.1,
  };
const NO_OVERRIDES: MeshOverrides = {};
const NO_DEFORMATIONS: readonly Deformation[] = [];
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
  deformations = NO_DEFORMATIONS,
  highlightedMeshId = null,
  onMeshSelect,
  scene: sceneOverrides,
  environmentSources,
  decoderPaths,
  enablePan = false,
  initialView,
  frontAzimuth = 0,
  effects = 'auto',
  idleRotate = true,
  playAnimationsOnLoad = true,
  onLoad,
  onEnvironmentStatus,
  onError,
  room = null,
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
  const capturerRef = useRef<CapturerController | null>(null);
  // What a capture needs from render-time state (the handle is created once).
  const captureState = useRef({ hasModel: false, background: DEFAULT_SCENE.background });
  useImperativeHandle(
    ref,
    () => ({
      replayAnimations: () => modelController.current?.replayAnimations(),
      setView: (view) => rigController.current?.goTo(view),
      getCameraAzimuth: () => rigController.current?.azimuth() ?? null,
      captureImage: async ({ watermark, ...options } = {}) => {
        const capturer = capturerRef.current;
        const { hasModel, background } = captureState.current;
        if (!capturer || !hasModel) return null;
        const render = capturer.capture(options);
        const out = document.createElement('canvas');
        out.width = render.width;
        out.height = render.height;
        const ctx = out.getContext('2d');
        if (!ctx) return null;
        paintBackground(ctx, background, out.width, out.height);
        ctx.drawImage(render, 0, 0);
        if (watermark) paintWatermark(ctx, watermark, out.width, out.height);
        return new Promise<Blob | null>((resolve) => out.toBlob(resolve, 'image/png'));
      },
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
  useLayoutEffect(() => {
    captureState.current = { hasModel: current !== null, background: scene.background };
  });

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
  const shapeSignature = `${hiddenSignature}|${JSON.stringify(deformations.map((d) => d.scale))}`;

  const [environmentStatus, setEnvironmentStatus] = useState<EnvironmentStatus>('ready');
  const handleEnvironmentStatus = useCallback(
    (status: EnvironmentStatus) => {
      setEnvironmentStatus(status);
      onEnvironmentStatus?.(status);
    },
    [onEnvironmentStatus],
  );

  // Room download progress, keyed by URL so a new room starts from zero without an effect.
  const [roomLoad, setRoomLoad] = useState<{
    url: string;
    progress: LoadProgress;
    /** Downloading, then preparing its lighting (behind a veil), then shown. */
    phase: 'download' | 'lighting' | 'ready';
  } | null>(null);
  const roomUrl = room?.url ?? null;
  const setRoomPhase = useCallback(
    (phase: 'download' | 'lighting' | 'ready', progress?: LoadProgress) => {
      if (!roomUrl) return;
      setRoomLoad((prev) => ({
        url: roomUrl,
        progress:
          progress ?? (prev?.url === roomUrl ? prev.progress : { fraction: 1, loadedBytes: 0 }),
        phase,
      }));
    },
    [roomUrl],
  );
  const handleRoomProgress = useCallback(
    (event: ProgressEvent) => setRoomPhase('download', progressFromEvent(event)),
    [setRoomPhase],
  );
  const handleRoomLighting = useCallback(() => setRoomPhase('lighting'), [setRoomPhase]);
  const handleRoomReady = useCallback(() => setRoomPhase('ready'), [setRoomPhase]);
  const roomState = roomLoad?.url === roomUrl ? roomLoad : null;
  const roomBusy = room !== null && roomState?.phase !== 'ready';
  // Where the camera may orbit in the room, keyed by room URL like the load state.
  const [orbit, setOrbit] = useState<{ url: string; limits: OrbitLimits } | null>(null);
  const handleOrbitLimits = useCallback(
    (limits: OrbitLimits) => {
      if (roomUrl) setOrbit({ url: roomUrl, limits });
    },
    [roomUrl],
  );
  const orbitLimits = room && orbit?.url === roomUrl ? orbit.limits : null;

  const studioLighting = (
    <SceneLighting
      scene={scene}
      stage={stage}
      shadowMapSize={quality.shadowMapSize}
      sources={sources}
      resolution={resolution}
      onStatus={handleEnvironmentStatus}
    />
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
        // Blurred (and scaled a touch, hiding the soft edges) while a room loads.
        style={{
          filter: roomBusy && current ? 'blur(14px)' : 'none',
          transform: roomBusy && current ? 'scale(1.04)' : 'none',
          transition: 'filter 450ms ease, transform 450ms ease',
        }}
      >
        {/* Frozen while a room loads or lights: compiling makes a few frames slow, and the
            resolution change it would trigger clears the canvas for a frame. */}
        <AdaptiveQuality onChange={roomBusy ? ignoreQuality : setQualityFactor} />
        <Capturer controllerRef={capturerRef} />
        {/* One studio light, kept until the room arrives (a fresh copy would flash black). */}
        {(!room || !current || !roomState || roomState.phase === 'download') && studioLighting}
        {room && current && (
          // A room failing to load leaves the product on its own rather than breaking the viewer.
          <ErrorBoundary key={room.url} onError={logRoomError}>
            <Suspense fallback={null}>
              <Room
                url={room.url}
                mood={room.mood}
                stage={stage}
                decoders={decoders}
                shadowMapSize={quality.shadowMapSize}
                onProgress={handleRoomProgress}
                onLighting={handleRoomLighting}
                onReady={handleRoomReady}
                minDistance={current.framing.minDistance}
                maxDistance={current.framing.maxDistance}
                onOrbitLimits={handleOrbitLimits}
              />
            </Suspense>
          </ErrorBoundary>
        )}
        {modelUrl && (
          <ErrorBoundary key={modelUrl} onError={handleError}>
            <Suspense fallback={null}>
              <Model
                url={modelUrl}
                decoders={decoders}
                playAnimationsOnLoad={playAnimationsOnLoad}
                meshOverrides={meshOverrides}
                deformations={deformations}
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
        {current && !room && scene.cyclorama && (
          <Cyclorama stage={stage} color={cycloramaColor(scene.background)} />
        )}
        {current && scene.shadows && !animating && (
          <SoftShadow key={`${current.url}|${shapeSignature}`} stage={stage} />
        )}
        {current && !room && !scene.cyclorama && (
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
          frontAzimuth={frontAzimuth}
          controllerRef={rigController}
          limits={orbitLimits}
        />
      </Canvas>
      <LoadingOverlay state={overlayState} />
      {room && (
        <>
          {/* Covers the switch to the room's lighting, so its first frames never show. */}
          <div
            aria-hidden
            style={{
              ...veilStyle,
              background: backgroundCss(scene.background),
              opacity: current && roomState?.phase === 'lighting' ? 0.94 : 0,
              // On at once (hiding the first frames), off with a fade.
              transition: roomState?.phase === 'lighting' ? 'none' : 'opacity 450ms ease',
            }}
          />
          <RoomLoadingIndicator
            name={room.name ?? 'room'}
            mood={room.mood}
            phase={roomState?.phase === 'lighting' ? 'lighting' : 'download'}
            progress={roomState?.progress ?? { fraction: null, loadedBytes: 0 }}
            visible={current !== null && roomState?.phase !== 'ready'}
          />
        </>
      )}
      {environmentStatus === 'loading' && overlayState.phase !== 'loading' && (
        <EnvironmentIndicator />
      )}
    </div>
  );
}
