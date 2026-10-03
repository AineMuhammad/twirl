'use client';

import type {
  EnvironmentStatus,
  MeshOverrides,
  ModelInfo,
  ViewerError,
  ViewerHandle,
} from '@twirl/viewer';
import {
  backgroundCss,
  type CameraView,
  DEFAULT_SCENE,
  type SceneSettings,
} from '@twirl/viewer/settings';
import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';

import { APP_NAME } from '@/config/app';
import { ENVIRONMENT_SOURCES, SAMPLE_MODELS } from '@/lib/demo-config';

import { CloseIcon, LogoMark, PlayIcon, ResetIcon, UploadIcon } from './icons';
import { LazyViewer } from './LazyViewer';
import { PartsPanel } from './PartsPanel';
import { ScenePanel } from './ScenePanel';
import { Tabs } from './Tabs';
import { focusRing, glass } from './ui';
import { useLocalModel } from './useLocalModel';

const NO_OVERRIDES: MeshOverrides = {};
const VIEW_BUTTONS: { view: CameraView; label: string }[] = [
  { view: 'front', label: 'Front' },
  { view: 'threeQuarter', label: '¾' },
  { view: 'side', label: 'Side' },
  { view: 'back', label: 'Back' },
  { view: 'top', label: 'Top' },
];
const PANEL_WIDTH = 'lg:w-[400px]';

export function DemoApp() {
  const [modelUrl, setModelUrl] = useState(SAMPLE_MODELS[0]?.url ?? null);
  const [info, setInfo] = useState<ModelInfo | null>(null);
  const [overrides, setOverrides] = useState<MeshOverrides>(NO_OVERRIDES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scene, setScene] = useState<SceneSettings>(DEFAULT_SCENE);
  const [lighting, setLighting] = useState<EnvironmentStatus>('ready');
  const [tab, setTab] = useState('parts');
  const [sheetOpen, setSheetOpen] = useState(true);
  const [hintVisible, setHintVisible] = useState(true);
  const viewer = useRef<ViewerHandle>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadModel = useCallback((url: string | null) => {
    setInfo(null);
    setOverrides(NO_OVERRIDES);
    setSelectedId(null);
    setModelUrl(url);
  }, []);
  const local = useLocalModel(loadModel);

  const onError = useCallback((error: ViewerError) => {
    console.error('[demo] viewer error', error.kind, error.cause);
  }, []);

  const current = SAMPLE_MODELS.find((m) => m.url === modelUrl);
  const title = current?.label ?? local.model?.name ?? 'Your model';
  const changes = Object.keys(overrides).length;

  return (
    <div
      className="relative h-dvh overflow-hidden text-neutral-900"
      style={{ background: backgroundCss(scene.background) }}
      {...local.dropHandlers}
    >
      {/* Stage: left of the full-height panel on desktop, above the bottom sheet on phones. */}
      <div
        className={`absolute inset-x-0 top-16 transition-[bottom] duration-300 lg:top-0 lg:right-[400px] lg:bottom-0 ${sheetOpen ? 'bottom-[calc(50svh-28px)]' : 'bottom-[124px]'}`}
        onPointerDown={() => setHintVisible(false)}
        onWheel={() => setHintVisible(false)}
      >
        <LazyViewer
          ref={viewer}
          modelUrl={modelUrl}
          scene={scene}
          environmentSources={ENVIRONMENT_SOURCES}
          meshOverrides={overrides}
          onLoad={setInfo}
          onEnvironmentStatus={setLighting}
          onError={onError}
        />
        {info && (
          <div
            role="group"
            aria-label="Camera view"
            className={`absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-full p-1 lg:bottom-5 ${glass}`}
          >
            {VIEW_BUTTONS.map(({ view, label }) => (
              <button
                key={view}
                type="button"
                aria-label={view === 'threeQuarter' ? 'Three-quarter view' : `${label} view`}
                onClick={() => {
                  setHintVisible(false);
                  viewer.current?.setView(view);
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-900/[0.06] hover:text-neutral-900 ${focusRing}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        {info && hintVisible && (
          <p className="pointer-events-none absolute right-4 bottom-4 hidden rounded-full bg-white/70 px-3 py-1.5 text-xs text-neutral-600 ring-1 ring-black/5 backdrop-blur lg:block">
            Drag to rotate · Scroll to zoom
          </p>
        )}
      </div>

      {/* Top bar, floating over the stage. */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 p-3 lg:right-[400px] lg:p-5">
        <Link
          href="/"
          className={`pointer-events-auto flex items-center gap-2 rounded-full py-2 pr-4 pl-3 ${glass} ${focusRing}`}
        >
          <LogoMark className="text-brand-600" />
          <span className="font-semibold tracking-tight">{APP_NAME}</span>
          <span className="hidden rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 sm:inline">
            Demo
          </span>
        </Link>

        <div className="pointer-events-auto flex items-center gap-2">
          <div
            role="group"
            aria-label="Model"
            className={`flex items-center gap-1 rounded-full p-1 ${glass}`}
          >
            {SAMPLE_MODELS.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={modelUrl === m.url}
                onClick={() => loadModel(m.url)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${focusRing} ${modelUrl === m.url ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:text-neutral-900'}`}
              >
                {m.label}
              </button>
            ))}
            {local.model && (
              <button
                type="button"
                aria-pressed={modelUrl === local.model.url}
                title={local.model.name}
                onClick={() => local.model && loadModel(local.model.url)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${focusRing} ${modelUrl === local.model.url ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:text-neutral-900'}`}
              >
                Your file
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            aria-label="Upload a model"
            className={`flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-[0_8px_24px_-8px_var(--color-brand-600)] transition-colors hover:bg-brand-700 ${focusRing}`}
          >
            <UploadIcon />
            <span className="hidden sm:inline">Upload</span>
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void local.open(file);
              e.target.value = ''; // allow picking the same file again
            }}
          />
        </div>
      </header>

      {local.error && (
        <div
          role="alert"
          className="absolute top-20 left-1/2 z-20 flex w-[min(92vw,28rem)] -translate-x-1/2 items-start gap-3 rounded-2xl bg-white px-4 py-3 text-sm shadow-[0_16px_48px_-12px_rgba(0,0,0,0.35)] ring-1 ring-red-500/20 lg:left-[calc((100%-400px)/2)]"
        >
          <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-red-500" />
          <p className="flex-1 text-neutral-800">{local.error}</p>
          <button
            type="button"
            onClick={local.dismissError}
            aria-label="Dismiss"
            className={`rounded-full p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 ${focusRing}`}
          >
            <CloseIcon />
          </button>
        </div>
      )}

      {/* Control panel: full-height sidebar flush right on desktop; bottom sheet on phones. */}
      <aside
        aria-label="Configure"
        className={`absolute inset-x-0 bottom-0 z-10 flex flex-col overflow-hidden rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_48px_-16px_rgba(0,0,0,0.3)] transition-[height] duration-300 lg:inset-y-0 lg:right-0 lg:left-auto lg:h-full lg:rounded-none lg:border-l lg:border-neutral-200/80 lg:pb-0 lg:shadow-none ${PANEL_WIDTH} ${sheetOpen ? 'h-[50svh]' : 'h-[148px]'}`}
      >
        <button
          type="button"
          onClick={() => setSheetOpen((open) => !open)}
          aria-expanded={sheetOpen}
          aria-label={sheetOpen ? 'Collapse panel' : 'Expand panel'}
          className={`flex shrink-0 justify-center pt-2 lg:hidden ${focusRing}`}
        >
          <span aria-hidden className="h-1.5 w-10 rounded-full bg-neutral-900/15" />
        </button>
        <Tabs
          active={tab}
          onChange={(id) => {
            setTab(id);
            setSheetOpen(true);
          }}
          header={
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="hidden text-xs font-semibold tracking-wider text-brand-600 uppercase lg:block">
                  Configure
                </p>
                <h1 className="truncate font-display text-2xl leading-tight lg:mt-1 lg:text-3xl">
                  {title}
                </h1>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {info
                    ? `${info.meshCount} parts · ${info.triangleCount.toLocaleString()} triangles`
                    : 'Loading model…'}
                </p>
              </div>
              {info && info.animationNames.length > 0 && (
                <button
                  type="button"
                  onClick={() => viewer.current?.replayAnimations()}
                  aria-label="Replay animation"
                  title="Replay animation"
                  className={`grid size-9 shrink-0 place-items-center rounded-full bg-neutral-900/[0.05] text-neutral-800 hover:bg-neutral-900/10 ${focusRing}`}
                >
                  <PlayIcon width={14} height={14} />
                </button>
              )}
            </div>
          }
          tabs={[
            {
              id: 'parts',
              label: 'Parts',
              content: (
                <PartsPanel
                  nodes={info?.meshTree ?? []}
                  overrides={overrides}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onOverridesChange={setOverrides}
                />
              ),
            },
            {
              id: 'scene',
              label: 'Scene',
              content: (
                <ScenePanel
                  scene={scene}
                  onChange={setScene}
                  lightingLoading={lighting === 'loading'}
                />
              ),
            },
          ]}
        />
        <footer className="hidden shrink-0 items-center justify-between gap-3 border-t border-neutral-100 px-5 py-3.5 lg:flex">
          <p className="text-xs text-neutral-500">
            {changes === 0 ? 'Original design' : `${changes} change${changes === 1 ? '' : 's'}`}
          </p>
          <button
            type="button"
            disabled={changes === 0}
            onClick={() => {
              setOverrides(NO_OVERRIDES);
              setSelectedId(null);
            }}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-40 disabled:hover:bg-transparent ${focusRing}`}
          >
            <ResetIcon width={14} height={14} /> Reset all
          </button>
        </footer>
      </aside>

      {local.dragging && (
        <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center bg-brand-900/30 backdrop-blur-md">
          <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-white/80 px-12 py-10 text-white">
            <UploadIcon width={28} height={28} />
            <p className="text-lg font-semibold">Drop to view your model</p>
            <p className="text-sm text-white/80">
              .glb or .gltf, up to 15 MB. It stays on your device.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
