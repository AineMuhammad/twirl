import { type ChangeEvent, type CSSProperties, useCallback, useRef, useState } from 'react';

import { type ModelInfo, Viewer, type ViewerError } from '../src';

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

  const blobUrl = useRef<string | null>(null);

  const selectModel = useCallback((url: string | null) => {
    // Free the previous local file once it's replaced.
    if (blobUrl.current && blobUrl.current !== url) URL.revokeObjectURL(blobUrl.current);
    blobUrl.current = url?.startsWith('blob:') ? url : null;
    setInfo(null);
    setError(null);
    setModelUrl(url);
  }, []);

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) selectModel(URL.createObjectURL(file));
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
          {error && (
            <p style={{ color: '#b91c1c' }}>
              Error ({error.kind}): {error.message}
            </p>
          )}
        </section>
      </aside>
      <main style={{ flex: 1, minWidth: 280, minHeight: 360 }}>
        {mounted && <Viewer modelUrl={modelUrl} onLoad={setInfo} onError={onError} />}
      </main>
    </div>
  );
}
