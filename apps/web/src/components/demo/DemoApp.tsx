'use client';

import type { MeshOverrides, ModelInfo, ViewerError, ViewerHandle } from '@twirl/viewer';
import { backgroundCss, DEFAULT_SCENE, type SceneSettings } from '@twirl/viewer/settings';
import { useCallback, useRef, useState } from 'react';

import { APP_NAME } from '@/config/app';
import { ENVIRONMENT_SOURCES, SAMPLE_MODELS } from '@/lib/demo-config';

import { CloseIcon, LogoMark, PlayIcon, UploadIcon } from './icons';
import { LazyViewer } from './LazyViewer';
import { PartsPanel } from './PartsPanel';
import { ScenePanel } from './ScenePanel';
import { Tabs } from './Tabs';
import { focusRing, glass } from './ui';
import { useLocalModel } from './useLocalModel';

const NO_OVERRIDES: MeshOverrides = {};

export function DemoApp() {
  const [modelUrl, setModelUrl] = useState(SAMPLE_MODELS[0]?.url ?? null);
  const [info, setInfo] = useState<ModelInfo | null>(null);
  const [overrides, setOverrides] = useState<MeshOverrides>(NO_OVERRIDES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scene, setScene] = useState<SceneSettings>(DEFAULT_SCENE);
  const [tab, setTab] = useState('parts');
  const [sheetOpen, setSheetOpen] = useState(true);
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

  return (
    <div
      className="relative h-dvh overflow-hidden text-neutral-900"
      style={{ background: backgroundCss(scene.background) }}
      {...local.dropHandlers}
    >
      {/* The 3D stage ends just under the panel's edge, so the product is centred in the visible
          area (left of the floating panel on desktop, above the bottom sheet on phones) and the
          canvas edge stays hidden behind the frosted panel. */}
      <div
        className={`absolute inset-x-0 top-16 transition-[bottom] duration-300 lg:top-0 lg:right-[380px] lg:bottom-0 ${sheetOpen ? 'bottom-[calc(50svh-28px)]' : 'bottom-[124px]'}`}
      >
        <LazyViewer
          ref={viewer}
          modelUrl={modelUrl}
          scene={scene}
          environmentSources={ENVIRONMENT_SOURCES}
          meshOverrides={overrides}
          onLoad={setInfo}
          onError={onError}
        />
      </div>

      {/* Top bar */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 p-3 lg:right-[412px]">
        <div
          className={`pointer-events-auto flex items-center gap-2 rounded-full py-2 pr-4 pl-3 ${glass}`}
        >
          <LogoMark className="text-neutral-900" />
          <span className="font-semibold tracking-tight">{APP_NAME}</span>
          <span className="hidden rounded-full bg-neutral-900/[0.06] px-2 py-0.5 text-xs font-medium text-neutral-600 sm:inline">
            Demo
          </span>
        </div>

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
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${focusRing} ${modelUrl === m.url ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:text-neutral-900'}`}
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
                className={`max-w-32 truncate rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${focusRing} ${modelUrl === local.model.url ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:text-neutral-900'}`}
              >
                Your file
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            aria-label="Upload a model"
            className={`flex items-center gap-2 rounded-full bg-neutral-900 px-3.5 py-2.5 text-sm font-medium text-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)] transition-colors hover:bg-neutral-700 ${focusRing}`}
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
          className="absolute top-20 left-1/2 z-20 flex w-[min(92vw,28rem)] -translate-x-1/2 items-start gap-3 rounded-2xl bg-white/90 px-4 py-3 text-sm shadow-[0_12px_48px_-12px_rgba(0,0,0,0.35)] ring-1 ring-red-500/20 backdrop-blur-xl lg:left-[calc((100%-412px)/2)]"
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

      {/* Control panel: floating card on desktop, bottom sheet on phones. */}
      <aside
        aria-label="Configure"
        className={`absolute inset-x-0 bottom-0 z-10 flex flex-col overflow-hidden rounded-t-3xl pb-[env(safe-area-inset-bottom)] transition-[height] duration-300 lg:inset-x-auto lg:top-3 lg:right-3 lg:bottom-3 lg:h-auto lg:w-[392px] lg:rounded-3xl lg:pb-0 ${glass} ${sheetOpen ? 'h-[50svh]' : 'h-[148px]'}`}
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
                <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
                <p className="text-xs text-neutral-500">
                  {info
                    ? `${info.meshCount} parts · ${info.triangleCount.toLocaleString()} triangles`
                    : 'Loading model…'}
                </p>
              </div>
              {info && info.animationNames.length > 0 && (
                <button
                  type="button"
                  onClick={() => viewer.current?.replayAnimations()}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full bg-neutral-900/[0.06] px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-900/10 ${focusRing}`}
                >
                  <PlayIcon width={12} height={12} /> Replay animation
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
              content: <ScenePanel scene={scene} onChange={setScene} />,
            },
          ]}
        />
      </aside>

      {local.dragging && (
        <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center bg-neutral-950/30 backdrop-blur-md">
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
