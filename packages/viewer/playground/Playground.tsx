import { type ChangeEvent, type CSSProperties, useCallback, useRef, useState } from 'react';

import {
  DEFAULT_SCENE,
  LIGHTING_PRESETS,
  type LightingPreset,
  type ModelInfo,
  type SceneSettings,
  Viewer,
  type ViewerError,
  type ViewerHandle,
} from '../src';

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
  const bg = scene.background;
  const bgColors = bg.type === 'solid' ? [bg.color, bg.color] : [bg.from, bg.to];

  const blobUrl = useRef<string | null>(null);
  const viewer = useRef<ViewerHandle>(null);

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
        <fieldset>
          <legend>Scene</legend>
          <label>
            Background{' '}
            <select
              value={bg.type}
              onChange={(e) =>
                setScene({
                  ...scene,
                  background:
                    e.target.value === 'solid'
                      ? { type: 'solid', color: bgColors[0] ?? '#ffffff' }
                      : {
                          type: 'gradient',
                          from: bgColors[0] ?? '#ffffff',
                          to: bgColors[1] ?? '#e9e9ec',
                        },
                })
              }
            >
              <option value="solid">Solid</option>
              <option value="gradient">Gradient</option>
            </select>
          </label>
          <div>
            <input
              type="color"
              aria-label={bg.type === 'solid' ? 'Background color' : 'Gradient top color'}
              value={bgColors[0]}
              onChange={(e) =>
                setScene({
                  ...scene,
                  background:
                    bg.type === 'solid'
                      ? { type: 'solid', color: e.target.value }
                      : { ...bg, from: e.target.value },
                })
              }
            />
            {bg.type === 'gradient' && (
              <input
                type="color"
                aria-label="Gradient bottom color"
                value={bg.to}
                onChange={(e) => setScene({ ...scene, background: { ...bg, to: e.target.value } })}
              />
            )}
          </div>
          <label>
            Lighting{' '}
            <select
              value={scene.lighting}
              onChange={(e) => setScene({ ...scene, lighting: e.target.value as LightingPreset })}
            >
              {LIGHTING_PRESETS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: 'block' }}>
            <input
              type="checkbox"
              checked={scene.floor}
              onChange={(e) => setScene({ ...scene, floor: e.target.checked })}
            />{' '}
            Floor
          </label>
          <label style={{ display: 'block' }}>
            <input
              type="checkbox"
              checked={scene.shadows}
              onChange={(e) => setScene({ ...scene, shadows: e.target.checked })}
            />{' '}
            Shadows
          </label>
        </fieldset>
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
            onLoad={setInfo}
            onError={onError}
          />
        )}
      </main>
    </div>
  );
}
