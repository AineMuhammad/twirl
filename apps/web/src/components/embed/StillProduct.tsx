'use client';

import { evaluate, type ProductConfig } from '@twirl/config-schema/engine';
import type { ModelInfo } from '@twirl/viewer';
import { backgroundCss } from '@twirl/viewer/settings';
import { deformationsForSelections, overridesForSelections } from '@twirl/viewer/ui';
import { useMemo, useState } from 'react';

import { LazyViewer } from '@/components/demo/LazyViewer';
import { APP_NAME } from '@/config/app';
import { ENVIRONMENT_SOURCES } from '@/lib/environments';

/**
 * A product whose free trial has ended: its default design as a still picture. No options,
 * price, quotes or sharing, and the camera doesn't move, so the merchant's page still looks
 * finished while the configurator itself is switched off.
 */
export function StillProduct({
  config,
  modelUrl,
  initialSelections,
}: {
  config: ProductConfig;
  modelUrl: string;
  initialSelections?: Record<string, unknown>;
}) {
  const [info, setInfo] = useState<ModelInfo | null>(null);
  const selections = useMemo(
    () => evaluate(config, initialSelections ?? {}).selections,
    [config, initialSelections],
  );
  const meshOverrides = useMemo(
    () => (info ? overridesForSelections(config, selections, info.meshTree) : {}),
    [config, selections, info],
  );
  const deformations = useMemo(
    () => (info ? deformationsForSelections(config, selections, info.meshTree) : []),
    [config, selections, info],
  );

  return (
    <main
      className="relative h-dvh overflow-hidden"
      style={{ background: backgroundCss(config.scene.background) }}
    >
      <h1 className="sr-only">{config.product.name}</h1>
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <LazyViewer
          modelUrl={modelUrl}
          scene={config.scene}
          environmentSources={ENVIRONMENT_SOURCES}
          meshOverrides={meshOverrides}
          deformations={deformations}
          initialView={config.presentation.camera.initialView}
          frontAzimuth={config.presentation.camera.frontAzimuth}
          idleRotate={false}
          onLoad={setInfo}
        />
      </div>
      <a
        href="/"
        target="_blank"
        rel="noopener"
        className="absolute top-3 left-3 z-20 rounded-full bg-surface/85 px-3 py-1.5 text-[12px] font-medium text-ink-soft shadow-sm ring-1 ring-line backdrop-blur hover:text-ink"
      >
        Made with {APP_NAME}
      </a>
    </main>
  );
}
