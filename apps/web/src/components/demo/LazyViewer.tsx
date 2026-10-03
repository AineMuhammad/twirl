'use client';

import dynamic from 'next/dynamic';

/**
 * The 3D viewer, loaded on the client only and in its own chunk, so three.js doesn't block the
 * page's first paint.
 */
export const LazyViewer = dynamic(() => import('@twirl/viewer').then((m) => m.Viewer), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-[14px] text-ink-muted">
      Loading 3D viewer…
    </div>
  ),
});
