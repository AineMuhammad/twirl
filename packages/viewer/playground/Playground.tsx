import { type ChangeEvent, type CSSProperties, useCallback, useRef, useState } from 'react';

import {
  DEFAULT_SCENE,
  type MeshOverride,
  type MeshOverrides,
  type ModelInfo,
  type SceneSettings,
  Viewer,
  type ViewerError,
  type ViewerHandle,
} from '../src';
import { MeshTreePanel } from './MeshTreePanel';
import { ScenePanel } from './ScenePanel';

// Optional: base URL of the 2k HDRIs (e.g. the R2 public URL + "/hdri/2k/"), via
// VITE_HDRI_2K_BASE_URL in packages/viewer/.env.local. Without it, 1k is used everywhere.
const HDRI_2K: string | undefined = import.meta.env.VITE_HDRI_2K_BASE_URL || undefined;
const ENVIRONMENT_SOURCES = HDRI_2K ? { '1k': '/hdri/1k/', '2k': HDRI_2K } : { '1k': '/hdri/1k/' };

const SAMPLES = [
  { label: 'Sofa (Draco + WebP, animated)', url: '/samples/sofa.glb' },
  { label: 'Jeep (Draco, 457k triangles)', url: '/samples/jeep_2021.glb' },
  { label: 'Missing file (error state)', url: '/samples/does-not-exist.glb' },
];

const layout: CSSProperties = { display: 'flex', height: '100%', flexWrap: 'wrap' };
const panel: CSSProperties = {
  width: 300,
  maxWidth: '100%',
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  borderRight: '1px solid #e5e5e5',
  overflowY: 'auto',
};

/** Dev-only harness: exercises the viewer outside Next.js. Not shipped. */
export function Playground() {
  const [modelUrl, setModelUrl] = useState<string | null>(SAMPLES[0]?.url ?? null);
  const [info, setInfo] = useState<ModelInfo | null>(null);
  const [error, setError] = useState<ViewerError | null>(null);
  const [mounted, setMounted] = useState(true);
  const [scene, setScene] = useState<SceneSettings>(DEFAULT_SCENE);
  const [overrides, setOverrides] = useState<MeshOverrides>({});
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const setOverride = useCallback((id: string, override: MeshOverride | null) => {
    setOverrides((current) => {
      const rest = Object.fromEntries(Object.entries(current).filter(([key]) => key !== id));
      return override ? { ...rest, [id]: override } : rest;
    });
  }, []);

  const blobUrl = useRef<string | null>(null);
  const viewer = useRef<ViewerHandle>(null);

  const selectModel = useCallback((url: string | null) => {
    // Free the previous local file once it's replaced.
    if (blobUrl.current && blobUrl.current !== url) URL.revokeObjectURL(blobUrl.current);
    blobUrl.current = url?.startsWith('blob:') ? url : null;
    setInfo(null);
    setError(null);
    setOverrides({});
    setSelectedId(null);
    setHoveredId(null);
    setModelUrl(url);
  }, []);

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) selectModel(URL.createObjectURL(file));
    // Reset so choosing the same file again still fires onChange.
    event.target.value = '';
  };

  const onError = useCallback((e: ViewerError) => {
    console.error('[viewer]', e.kind, e.cause);
    setError(e);
  }, []);

  return (
    <div style={layout}>
      <aside style={panel}>
        <strong>Viewer playground</strong>
        <label>
          Sample
          <select
            style={{ display: 'block', width: '100%' }}
            value={SAMPLES.some((s) => s.url === modelUrl) ? (modelUrl ?? '') : ''}
            onChange={(e) => selectModel(e.target.value || null)}
          >
            <option value="">(none / local file)</option>
            {SAMPLES.map((s) => (
              <option key={s.url} value={s.url}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Local .glb file
          <input type="file" accept=".glb,.gltf" onChange={onFile} style={{ display: 'block' }} />
        </label>
        <ScenePanel scene={scene} onChange={setScene} />
        <button
          type="button"
          onClick={() => viewer.current?.replayAnimations()}
          disabled={!info?.animationNames.length}
        >
          Replay animation
        </button>
        <button type="button" onClick={() => setMounted((m) => !m)}>
          {mounted ? 'Unmount viewer' : 'Mount viewer'}
        </button>
        <section aria-label="Model info">
          {info && (
            <ul>
              <li>Meshes: {info.meshCount}</li>
              <li>Triangles: {info.triangleCount.toLocaleString()}</li>
              <li>Animations: {info.animationNames.join(', ') || 'none'}</li>
            </ul>
          )}
          {info && (
            <MeshTreePanel
              nodes={info.meshTree}
              overrides={overrides}
              selectedId={selectedId}
              onChange={setOverride}
              onHover={setHoveredId}
            />
          )}
          {error && (
            <p style={{ color: '#b91c1c' }}>
              Error ({error.kind}): {error.message}
            </p>
          )}
        </section>
      </aside>
      <main style={{ flex: 1, minWidth: 280, minHeight: 360 }}>
        {mounted && (
          <Viewer
            ref={viewer}
            modelUrl={modelUrl}
            scene={scene}
            environmentSources={ENVIRONMENT_SOURCES}
            meshOverrides={overrides}
            highlightedMeshId={hoveredId ?? selectedId}
            onMeshSelect={setSelectedId}
            onLoad={setInfo}
            onError={onError}
          />
        )}
      </main>
    </div>
  );
}
