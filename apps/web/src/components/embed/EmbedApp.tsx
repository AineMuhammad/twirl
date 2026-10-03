'use client';

import type { Evaluation, ProductConfig } from '@twirl/config-schema/engine';
import { Configurator } from '@twirl/viewer/ui';
import { useCallback, useEffect } from 'react';

import { LazyViewer } from '@/components/demo/LazyViewer';
import { APP_NAME } from '@/config/app';
import { EMBED_SOURCE, type EmbedMessage, preferredHeight } from '@/lib/embed-protocol';
import { ENVIRONMENT_SOURCES } from '@/lib/environments';

const VIEWER_PROPS = { environmentSources: ENVIRONMENT_SOURCES };

/** Tells the host page (via embed.js) about size and changes. The data isn't sensitive. */
function post(message: EmbedMessage) {
  if (window.parent !== window) window.parent.postMessage(message, '*');
}

/** Saves the design and returns its link (on this site, which serves /c/…). */
async function shareDesign(publicId: string, versionId: string, evaluation: Evaluation) {
  const response = await fetch('/api/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicId, versionId, selections: evaluation.selections }),
  });
  const body = (await response.json().catch(() => null)) as {
    shortId?: string;
    error?: string;
  } | null;
  if (!response.ok || !body?.shortId) {
    throw new Error(body?.error ?? 'Could not create a link. Please try again.');
  }
  return `${window.location.origin}/c/${body.shortId}`;
}

export function EmbedApp({
  publicId,
  versionId,
  config,
  modelUrl,
  watermark,
  initialSelections,
}: {
  publicId: string;
  versionId: string;
  config: ProductConfig;
  modelUrl: string;
  watermark: boolean;
  /** Choices to start from (share links). */
  initialSelections?: Record<string, unknown>;
}) {
  useEffect(() => {
    post({ source: EMBED_SOURCE, type: 'ready', productId: publicId });
    const resize = () =>
      post({
        source: EMBED_SOURCE,
        type: 'resize',
        productId: publicId,
        height: preferredHeight(window.innerWidth),
      });
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [publicId]);

  const onEvaluationChange = useCallback(
    (evaluation: Evaluation) =>
      post({
        source: EMBED_SOURCE,
        type: 'change',
        productId: publicId,
        selections: evaluation.selections,
        price: { total: evaluation.price.total, currency: evaluation.price.currency },
      }),
    [publicId],
  );

  const onShare = useCallback(
    (evaluation: Evaluation) => shareDesign(publicId, versionId, evaluation),
    [publicId, versionId],
  );

  return (
    <Configurator
      config={config}
      modelUrl={modelUrl}
      Viewer={LazyViewer}
      viewerProps={VIEWER_PROPS}
      onEvaluationChange={onEvaluationChange}
      onShare={onShare}
      {...(initialSelections && { initialSelections })}
    >
      {watermark && (
        <a
          href="/"
          target="_blank"
          rel="noopener"
          className="absolute top-3 left-3 z-20 rounded-full bg-surface/85 px-3 py-1.5 text-[12px] font-medium text-ink-soft shadow-sm ring-1 ring-line backdrop-blur hover:text-ink"
        >
          Made with {APP_NAME}
        </a>
      )}
    </Configurator>
  );
}
