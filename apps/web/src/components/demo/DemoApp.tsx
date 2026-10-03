'use client';

import type { ModelInfo, ViewerError, ViewerProps } from '@twirl/viewer';
import { DEFAULT_SCENE, type SceneSettings } from '@twirl/viewer/settings';
import {
  CloseIcon,
  Configurator,
  focusRing,
  glass,
  LogoMark,
  MoonIcon,
  SunIcon,
  UploadIcon,
} from '@twirl/viewer/ui';
import Link from 'next/link';
import { useCallback, useMemo, useRef, useState } from 'react';

import { APP_NAME } from '@/config/app';
import { ENVIRONMENT_SOURCES, SAMPLE_MODELS } from '@/lib/demo-config';
import { BACKDROP_FOR_THEME, sameBackground } from '@/lib/scene-presets';

import { LazyViewer } from './LazyViewer';
import { ScenePanel } from './ScenePanel';
import { type ConfigSource, useProductConfig } from './useProductConfig';
import { useLocalModel } from './useLocalModel';
import { useTheme } from './useTheme';

/** A sample's own look; uploads get the default look. */
function sceneFor(url: string | null): SceneSettings {
  const sample = SAMPLE_MODELS.find((m) => m.url === url);
  return { ...DEFAULT_SCENE, ...sample?.config.scene } as SceneSettings;
}

export function DemoApp() {
  const [modelUrl, setModelUrl] = useState(SAMPLE_MODELS[0]?.url ?? null);
  const [uploadTree, setUploadTree] = useState<{ url: string; info: ModelInfo } | null>(null);
  const [scene, setScene] = useState<SceneSettings>(() => sceneFor(modelUrl));
  const [lighting, setLighting] = useState<'loading' | 'ready' | 'error'>('ready');
  const [theme, setTheme] = useTheme();
  const fileInput = useRef<HTMLInputElement>(null);

  const loadModel = useCallback((url: string | null) => {
    setScene(sceneFor(url));
    setModelUrl(url);
  }, []);
  const local = useLocalModel(loadModel);
  const sample = SAMPLE_MODELS.find((m) => m.url === modelUrl);

  // Samples use their saved config; uploads get a starter config generated from their parts.
  const source = useMemo<ConfigSource | null>(() => {
    if (sample) return { kind: 'saved', key: sample.url, input: sample.config };
    if (local.model && uploadTree?.url === local.model.url) {
      return {
        kind: 'starter',
        key: uploadTree.url,
        name: local.model.name,
        meshTree: uploadTree.info.meshTree,
      };
    }
    return null;
  }, [sample, local.model, uploadTree]);
  const config = useProductConfig(source);

  // A product's default backdrop pairs with the theme: its own backdrop in light, charcoal in
  // dark. A backdrop the shopper picked themselves is left alone.
  const lightBackdrop = sceneFor(modelUrl).background;
  const sceneForTheme: SceneSettings =
    theme === 'dark' && sameBackground(scene.background, lightBackdrop)
      ? { ...scene, background: BACKDROP_FOR_THEME.dark }
      : scene;
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    // Going light again restores the product's own backdrop if the dark default was showing.
    if (next === 'light' && sameBackground(sceneForTheme.background, BACKDROP_FOR_THEME.dark)) {
      setScene((s) => ({ ...s, background: lightBackdrop }));
    }
    setTheme(next);
  };

  const onError = useCallback((error: ViewerError) => {
    console.error('[demo] viewer error', error.kind, error.cause);
  }, []);
  const viewerProps = useMemo<Partial<ViewerProps>>(
    () => ({ environmentSources: ENVIRONMENT_SOURCES, onEnvironmentStatus: setLighting, onError }),
    [onError],
  );
  const onLoad = useCallback(
    (info: ModelInfo) => {
      if (modelUrl && !SAMPLE_MODELS.some((m) => m.url === modelUrl)) {
        setUploadTree({ url: modelUrl, info });
      }
    },
    [modelUrl],
  );

  return (
    <Configurator
      config={config}
      modelUrl={modelUrl}
      Viewer={LazyViewer}
      viewerProps={viewerProps}
      scene={sceneForTheme}
      title={local.model?.name ?? 'Your model'}
      onLoad={onLoad}
      rootProps={local.dropHandlers}
      topBar={
        <>
          <Link
            href="/"
            className={`pointer-events-auto flex items-center gap-2 rounded-full py-2 pr-4 pl-3 ${glass} ${focusRing}`}
          >
            <LogoMark className="text-brand-600" />
            <span className="font-semibold tracking-tight">{APP_NAME}</span>
            <span className="hidden rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 sm:inline dark:bg-brand-500/20 dark:text-brand-200">
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
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${focusRing} ${modelUrl === m.url ? 'bg-ink text-surface' : 'text-ink-soft hover:text-ink'}`}
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
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${focusRing} ${modelUrl === local.model.url ? 'bg-ink text-surface' : 'text-ink-soft hover:text-ink'}`}
                >
                  Your file
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
              className={`grid size-10 place-items-center rounded-full text-ink-soft hover:text-ink ${glass} ${focusRing}`}
            >
              {theme === 'dark' ? (
                <SunIcon width={18} height={18} />
              ) : (
                <MoonIcon width={18} height={18} />
              )}
            </button>
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
        </>
      }
      extraTabs={[
        {
          id: 'scene',
          label: 'Scene',
          content: (
            <ScenePanel
              scene={sceneForTheme}
              onChange={setScene}
              lightingLoading={lighting === 'loading'}
            />
          ),
        },
      ]}
    >
      {local.error && (
        <div
          role="alert"
          className="absolute top-20 left-1/2 z-20 flex w-[min(92vw,28rem)] -translate-x-1/2 items-start gap-3 rounded-2xl bg-surface px-4 py-3 text-sm shadow-[0_16px_48px_-12px_rgba(0,0,0,0.35)] ring-1 ring-red-500/20"
        >
          <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-red-500" />
          <p className="flex-1 text-ink-soft">{local.error}</p>
          <button
            type="button"
            onClick={local.dismissError}
            aria-label="Dismiss"
            className={`rounded-full p-1 text-ink-muted hover:bg-tint hover:text-ink ${focusRing}`}
          >
            <CloseIcon />
          </button>
        </div>
      )}

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
    </Configurator>
  );
}
