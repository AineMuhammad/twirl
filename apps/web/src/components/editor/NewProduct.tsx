'use client';

import { humanizeName } from '@twirl/config-schema/engine';
import type { ModelInfo } from '@twirl/viewer';
import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';

import { createProductAction } from '@/app/dashboard/products/actions';
import { LazyViewer } from '@/components/demo/LazyViewer';
import { ENVIRONMENT_SOURCES } from '@/lib/environments';

/**
 * Creates a product from an uploaded model. The model loads in the viewer first, so the starter
 * config is built from exactly the mesh tree the viewer renders.
 */
export function NewProduct({
  assetId,
  modelUrl,
  filename,
}: {
  assetId: string;
  modelUrl: string;
  filename: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const onLoad = useCallback(
    async (info: ModelInfo) => {
      if (started.current) return;
      started.current = true;
      const { starterConfig } = await import('@twirl/config-schema');
      const name = humanizeName(filename.replace(/\.(glb|gltf)$/i, '')) || 'New product';
      // Parts only: the merchant chooses what's customisable in the editor.
      const config = starterConfig({ name, meshTree: info.meshTree, withOptions: false });
      const result = await createProductAction({ assetId, config });
      // On success the action redirects to the editor.
      if (result.error) setError(result.error);
    },
    [assetId, filename],
  );

  return (
    <div className="relative h-dvh bg-tint">
      <LazyViewer modelUrl={modelUrl} environmentSources={ENVIRONMENT_SOURCES} onLoad={onLoad} />
      <div className="pointer-events-none absolute inset-x-0 top-6 flex justify-center">
        <div
          role="status"
          className="pointer-events-auto rounded-2xl bg-surface px-5 py-3 text-[15px] shadow-lg ring-1 ring-line"
        >
          {error ? (
            <span className="text-red-600 dark:text-red-400">
              {error}{' '}
              <Link href="/dashboard" className="font-medium underline">
                Back to dashboard
              </Link>
            </span>
          ) : (
            <span className="text-ink-soft">Setting up your product from {filename}…</span>
          )}
        </div>
      </div>
    </div>
  );
}
