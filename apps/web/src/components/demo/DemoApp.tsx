'use client';

import type { MeshOverrides, ModelInfo, ViewerError } from '@twirl/viewer';
import { useCallback, useState } from 'react';

import { APP_NAME } from '@/config/app';
import { ENVIRONMENT_SOURCES, SAMPLE_MODELS } from '@/lib/demo-config';

import { LazyViewer } from './LazyViewer';
import { PartsPanel } from './PartsPanel';

const NO_OVERRIDES: MeshOverrides = {};

export function DemoApp() {
  const [modelUrl, setModelUrl] = useState(SAMPLE_MODELS[0]?.url ?? null);
  const [info, setInfo] = useState<ModelInfo | null>(null);
  const [overrides, setOverrides] = useState<MeshOverrides>(NO_OVERRIDES);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const loadModel = (url: string | null) => {
    setInfo(null);
    setOverrides(NO_OVERRIDES);
    setSelectedId(null);
    setHighlightedId(null);
    setModelUrl(url);
  };

  const onError = useCallback((error: ViewerError) => {
    console.error('[demo] viewer error', error.kind, error.cause);
  }, []);

  return (
    <div className="flex h-dvh flex-col bg-neutral-50 text-neutral-900">
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-neutral-200 bg-white px-4">
        <p className="font-semibold tracking-tight">
          {APP_NAME} <span className="font-normal text-neutral-500">· Demo</span>
        </p>
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
          </select>
        </label>
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="relative min-h-0 flex-1">
          <LazyViewer
            modelUrl={modelUrl}
            environmentSources={ENVIRONMENT_SOURCES}
            meshOverrides={overrides}
            highlightedMeshId={highlightedId ?? selectedId}
            onMeshSelect={setSelectedId}
            onLoad={setInfo}
            onError={onError}
          />
          {info && (
            <p className="pointer-events-none absolute bottom-3 left-3 rounded bg-white/80 px-2 py-1 text-xs text-neutral-600">
              {info.meshCount} meshes · {info.triangleCount.toLocaleString()} triangles
            </p>
          )}
        </main>

        <aside
          className="w-[360px] shrink-0 overflow-y-auto border-l border-neutral-200 bg-white"
          aria-label="Configure"
        >
          <h2 className="px-4 pt-4 text-sm font-semibold">Parts</h2>
          <PartsPanel
            nodes={info?.meshTree ?? []}
            overrides={overrides}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onHighlight={setHighlightedId}
            onOverridesChange={setOverrides}
          />
        </aside>
      </div>
    </div>
  );
}
