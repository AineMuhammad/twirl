'use client';

import type { MeshOverrides, ModelInfo, MeshTreeNode } from '@twirl/viewer';
import { DEFAULT_SCENE, type SceneSettings } from '@twirl/viewer/settings';
import { useEffect, useMemo, useRef, useState } from 'react';

import { LazyViewer } from '@/components/demo/LazyViewer';
import { ENVIRONMENT_SOURCES } from '@/lib/environments';

const SCENE: SceneSettings = {
  ...DEFAULT_SCENE,
  lighting: 'warm',
  background: { type: 'radial', inner: '#fffaf3', outer: '#e9dccb' },
  cyclorama: true,
};

/** Fabrics the seat cycles through (null = the model's own weave). */
const FABRICS: (string | null)[] = [null, '#2f6f6a', '#b5532f', '#d8ccb6', '#232b4a'];
const CYCLE_MS = 3200;

function findNode(nodes: readonly MeshTreeNode[], name: string): string | null {
  for (const node of nodes) {
    if (node.name === name) return node.id;
    const child = findNode(node.children, name);
    if (child) return child;
  }
  return null;
}

/**
 * A small, view-only 3D scene for the landing page: the sample chair turning slowly while its
 * fabric changes. It mounts only when scrolled into view, so the page itself stays light.
 */
export function HeroScene() {
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [seat, setSeat] = useState<string | null>(null);
  const [fabric, setFabric] = useState(0);

  useEffect(() => {
    const el = container.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!seat || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => setFabric((i) => (i + 1) % FABRICS.length), CYCLE_MS);
    return () => clearInterval(timer);
  }, [seat]);

  const overrides = useMemo<MeshOverrides>(() => {
    const color = FABRICS[fabric];
    return seat && color ? { [seat]: { color } } : {};
  }, [seat, fabric]);

  return (
    <div
      ref={container}
      className="relative aspect-[5/4] w-full overflow-hidden rounded-xl ring-1 ring-line"
      style={{ background: 'radial-gradient(120% 95% at 50% 38%, #fffaf3 0%, #e9dccb 100%)' }}
    >
      <span className="sr-only">
        A lounge chair turning slowly while its fabric changes colour.
      </span>
      {/* View-only: the scene ignores the pointer so it never traps scrolling. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {visible && (
          <LazyViewer
            modelUrl="/samples/sofa.glb"
            scene={SCENE}
            environmentSources={ENVIRONMENT_SOURCES}
            meshOverrides={overrides}
            idleRotate
            onLoad={(info: ModelInfo) => setSeat(findNode(info.meshTree, 'Chair'))}
          />
        )}
      </div>
      <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-[13px] text-ink-soft shadow-sm ring-1 ring-line">
        <span aria-hidden className="size-2 rounded-full bg-emerald-600" />
        Live 3D, rendered in the browser
      </div>
    </div>
  );
}
