'use client';

import {
  DEFAULT_SCENE,
  type MeshOverrides,
  type ModelInfo,
  type SceneSettings,
  type ViewerError,
  type ViewerHandle,
} from '@twirl/viewer';
import { useCallback, useRef, useState } from 'react';

import { APP_NAME } from '@/config/app';
import { ENVIRONMENT_SOURCES, SAMPLE_MODELS } from '@/lib/demo-config';

import { LazyViewer } from './LazyViewer';
import { PartsPanel } from './PartsPanel';
import { ScenePanel } from './ScenePanel';
import { Tabs } from './Tabs';
import { useLocalModel } from './useLocalModel';

const NO_OVERRIDES: MeshOverrides = {};

export function DemoApp() {
  const [modelUrl, setModelUrl] = useState(SAMPLE_MODELS[0]?.url ?? null);
  const [info, setInfo] = useState<ModelInfo | null>(null);
  const [overrides, setOverrides] = useState<MeshOverrides>(NO_OVERRIDES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scene, setScene] = useState<SceneSettings>(DEFAULT_SCENE);
  const [tab, setTab] = useState('parts');
  const viewer = useRef<ViewerHandle>(null);

  const loadModel = useCallback((url: string | null) => {
    setInfo(null);
    setOverrides(NO_OVERRIDES);
    setSelectedId(null);
    setModelUrl(url);
  }, []);
  const local = useLocalModel(loadModel);
  const fileInput = useRef<HTMLInputElement>(null);

  const onError = useCallback((error: ViewerError) => {
    console.error('[demo] viewer error', error.kind, error.cause);
  }, []);

  return (
    <div
      className="relative flex h-dvh flex-col bg-neutral-50 text-neutral-900"
      {...local.dropHandlers}
    >
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-neutral-200 bg-white px-4">
        <p className="font-semibold tracking-tight">
          {APP_NAME} <span className="font-normal text-neutral-500">· Demo</span>
        </p>
        <div className="flex items-center gap-2 text-sm">
          <label className="flex items-center gap-2 text-sm">
            <span className="sr-only sm:not-sr-only">Model</span>
            <select
              className="rounded-md border border-neutral-300 bg-white px-2 py-1.5"
              value={modelUrl ?? ''}
              onChange={(e) => loadModel(e.target.value)}
            >
              {SAMPLE_MODELS.map((m) => (
                <option key={m.id} value={m.url}>
                  {m.label}
                </option>
              ))}
              {local.model && (
                <option value={local.model.url}>Your file: {local.model.name}</option>
              )}
            </select>
          </label>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="rounded-md bg-neutral-900 px-3 py-1.5 font-medium text-white hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Upload
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

      {/* Phones/tablets: viewer on top, panel below. Desktop (lg): panel as a right sidebar. */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main className="relative h-[55svh] shrink-0 lg:h-auto lg:min-h-0 lg:flex-1">
          {local.error && (
            <div
              role="alert"
              className="absolute inset-x-3 top-3 z-10 flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 shadow-sm"
            >
              <p className="flex-1">{local.error}</p>
              <button
                type="button"
                onClick={local.dismissError}
                className="rounded px-1 font-medium hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-red-700"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          )}
          <LazyViewer
            ref={viewer}
            modelUrl={modelUrl}
            scene={scene}
            environmentSources={ENVIRONMENT_SOURCES}
            meshOverrides={overrides}
            onLoad={setInfo}
            onError={onError}
          />
          {info && info.animationNames.length > 0 && (
            <button
              type="button"
              onClick={() => viewer.current?.replayAnimations()}
              className="absolute right-3 bottom-3 rounded-md border border-neutral-300 bg-white/90 px-3 py-1.5 text-sm shadow-sm hover:bg-white focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              Replay animation
            </button>
          )}
          {info && (
            <p className="pointer-events-none absolute bottom-3 left-3 rounded bg-white/80 px-2 py-1 text-xs text-neutral-600">
              {info.meshCount} meshes · {info.triangleCount.toLocaleString()} triangles
            </p>
          )}
        </main>

        <aside
          className="flex min-h-0 flex-1 flex-col border-t border-neutral-200 bg-white lg:w-[360px] lg:flex-none lg:border-t-0 lg:border-l"
          aria-label="Configure"
        >
          <Tabs
            active={tab}
            onChange={setTab}
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
      </div>
      {local.dragging && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm">
          <p className="rounded-xl border-2 border-dashed border-white px-8 py-6 text-lg font-medium text-white">
            Drop your .glb or .gltf to view it
          </p>
        </div>
      )}
    </div>
  );
}
