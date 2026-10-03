'use client';

import {
  type Correction,
  defaultSelections,
  type Evaluation,
  evaluate,
  formatPrice,
  type ProductConfig,
  type SelectionValue,
} from '@twirl/config-schema/engine';
import {
  type ComponentType,
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type { CameraView } from '../camera-views';
import { backgroundCss, DEFAULT_SCENE, type SceneSettings } from '../scene';
import type { MeshOverrides, ModelInfo } from '../types';
import { CloseIcon, PlayIcon, ResetIcon } from '../ui/icons';
import { type Tab, Tabs } from '../ui/Tabs';
import { focusRing, glass } from '../ui/ui';
import type { ViewerHandle, ViewerProps } from '../Viewer';
import { overridesForSelections } from './config-overrides';
import { OptionsPanel } from './OptionsPanel';
import { accentVars, titleFontClass } from './theme';

export type ConfiguratorLayout = 'sidebar' | 'bottomBar' | 'fullscreen';

export interface ConfiguratorProps {
  /** The product's (parsed) config. `null` shows the model without options, e.g. while a
   * generated config is being prepared. */
  config: ProductConfig | null;
  modelUrl: string | null;
  /** The viewer to render: `Viewer` itself, or a lazily loaded wrapper of it. */
  Viewer: ComponentType<ViewerProps>;
  /** Extra viewer props (environment sources, decoder paths, effects…). */
  viewerProps?: Omit<
    ViewerProps,
    'ref' | 'modelUrl' | 'meshOverrides' | 'scene' | 'onLoad' | 'initialView'
  >;
  /** Overrides `config.scene` (e.g. a demo's scene controls). */
  scene?: SceneSettings;
  /** Overrides `config.presentation.layout`. */
  layout?: ConfiguratorLayout;
  /** Title while there is no config. */
  title?: string;
  /** Floating bar over the top of the stage (brand, model switcher…). */
  topBar?: ReactNode;
  /** Panel tabs after "Options". */
  extraTabs?: Tab[];
  /** Rendered last, over everything (alerts, drop zones). */
  children?: ReactNode;
  /** Props for the root element (e.g. drag-and-drop handlers). */
  rootProps?: HTMLAttributes<HTMLDivElement>;
  onLoad?: (info: ModelInfo) => void;
  /** Called with the evaluated configuration (selections, price) whenever it changes. */
  onEvaluationChange?: (evaluation: Evaluation) => void;
}

const NO_OVERRIDES: MeshOverrides = {};
const NOTICE_SECONDS = 6;
const VIEW_BUTTONS: { view: CameraView; label: string }[] = [
  { view: 'front', label: 'Front' },
  { view: 'threeQuarter', label: '¾' },
  { view: 'side', label: 'Side' },
  { view: 'back', label: 'Back' },
  { view: 'top', label: 'Top' },
];

/** Placement per layout. Phones always get a bottom sheet; layouts differ from `lg` up. */
const LAYOUTS: Record<
  ConfiguratorLayout,
  { stage: string; panel: string; top: string; options?: string }
> = {
  sidebar: {
    stage: 'lg:top-0 lg:right-[400px] lg:bottom-0',
    panel:
      'lg:inset-y-0 lg:right-0 lg:left-auto lg:h-full lg:w-[400px] lg:rounded-none lg:border-l lg:border-line lg:shadow-none',
    top: 'lg:right-[400px]',
  },
  bottomBar: {
    stage: 'lg:top-0 lg:right-0 lg:bottom-[320px]',
    panel: 'lg:h-[320px] lg:rounded-none lg:border-t lg:border-line lg:shadow-none',
    top: '',
    options: 'lg:grid lg:grid-cols-3 lg:items-start lg:gap-2 lg:space-y-0',
  },
  fullscreen: {
    stage: 'lg:inset-0',
    panel: `lg:top-20 lg:right-5 lg:bottom-5 lg:left-auto lg:h-auto lg:w-[380px] lg:rounded-3xl ${glass}`,
    top: 'lg:right-[420px]',
  },
};

/** Groups whose value differs from the default. */
function changeCount(config: ProductConfig, evaluation: Evaluation) {
  const defaults = defaultSelections(config);
  return config.groups.filter(
    (g) => JSON.stringify(evaluation.selections[g.id]) !== JSON.stringify(defaults[g.id]),
  ).length;
}

/**
 * A complete product configurator: the 3D stage plus an options panel generated from the
 * product config, with live price, rule corrections and the configured layout and theme.
 */
export function Configurator({
  config,
  modelUrl,
  Viewer,
  viewerProps,
  scene: sceneOverride,
  layout: layoutOverride,
  title,
  topBar,
  extraTabs = [],
  children,
  rootProps,
  onLoad,
  onEvaluationChange,
}: ConfiguratorProps) {
  const viewer = useRef<ViewerHandle>(null);
  const [loaded, setLoaded] = useState<{ url: string | null; info: ModelInfo } | null>(null);
  const info = loaded?.url === modelUrl ? loaded.info : null;
  const [evaluation, setEvaluation] = useState(() => (config ? evaluate(config, {}) : null));
  const [evaluatedFor, setEvaluatedFor] = useState(config);
  const [notices, setNotices] = useState<Correction[]>([]);
  const [tab, setTab] = useState('options');
  const [sheetOpen, setSheetOpen] = useState(true);
  const [hintVisible, setHintVisible] = useState(true);

  // A new config starts from its defaults (adjusting state during render, not in an effect).
  if (config !== evaluatedFor) {
    setEvaluatedFor(config);
    setEvaluation(config ? evaluate(config, {}) : null);
    setNotices([]);
  }
  const current = config && evaluation && evaluatedFor === config ? evaluation : null;

  useEffect(() => {
    if (current) onEvaluationChange?.(current);
  }, [current, onEvaluationChange]);

  useEffect(() => {
    if (notices.length === 0) return;
    const timer = setTimeout(() => setNotices([]), NOTICE_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, [notices]);

  const meshOverrides = useMemo(
    () =>
      config && current && info
        ? overridesForSelections(config, current.selections, info.meshTree)
        : NO_OVERRIDES,
    [config, current, info],
  );

  const change = (group: string, value: SelectionValue) => {
    if (!config || !current) return;
    const next = evaluate(config, { ...current.selections, [group]: value }, group);
    setEvaluation(next);
    setNotices(next.corrections);
  };

  const scene = sceneOverride ?? config?.scene ?? DEFAULT_SCENE;
  const presentation = config?.presentation;
  const layout = LAYOUTS[layoutOverride ?? presentation?.layout ?? 'sidebar'];
  const changes = config && current ? changeCount(config, current) : 0;
  const heading = config?.product.name ?? title ?? 'Your model';

  return (
    <div
      {...rootProps}
      className="relative h-dvh overflow-hidden text-ink"
      style={{
        background: backgroundCss(scene.background),
        ...(presentation && accentVars(presentation.theme.accent)),
      }}
    >
      {/* Stage. Phones: above the bottom sheet. */}
      <div
        className={`absolute inset-x-0 top-16 transition-[bottom] duration-300 ${layout.stage} ${sheetOpen ? 'bottom-[calc(50svh-28px)]' : 'bottom-[188px]'}`}
        onPointerDown={() => setHintVisible(false)}
        onWheel={() => setHintVisible(false)}
      >
        <Viewer
          {...viewerProps}
          ref={viewer}
          modelUrl={modelUrl}
          scene={scene}
          meshOverrides={meshOverrides}
          {...(presentation && { initialView: presentation.camera.initialView })}
          onLoad={(next) => {
            setLoaded({ url: modelUrl, info: next });
            onLoad?.(next);
          }}
        />
        {info && (
          <div
            role="group"
            aria-label="Camera view"
            className={`absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-full p-1 lg:bottom-5 ${glass}`}
          >
            {VIEW_BUTTONS.map(({ view, label }) => (
              <button
                key={view}
                type="button"
                aria-label={view === 'threeQuarter' ? 'Three-quarter view' : `${label} view`}
                onClick={() => {
                  setHintVisible(false);
                  viewer.current?.setView(view);
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-tint-strong hover:text-ink ${focusRing}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        {info && hintVisible && (
          <p className="pointer-events-none absolute right-4 bottom-4 hidden rounded-full bg-surface/70 px-3 py-1.5 text-xs text-ink-soft ring-1 ring-line backdrop-blur lg:block">
            Drag to rotate · Scroll to zoom
          </p>
        )}
      </div>

      {topBar && (
        <header
          className={`pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 p-3 lg:p-5 ${layout.top}`}
        >
          {topBar}
        </header>
      )}

      <aside
        aria-label="Configure"
        className={`absolute inset-x-0 bottom-0 z-10 flex flex-col overflow-hidden rounded-t-3xl bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_48px_-16px_rgba(0,0,0,0.3)] transition-[height] duration-300 lg:pb-0 ${layout.panel} ${sheetOpen ? 'h-[50svh]' : 'h-[212px]'}`}
      >
        <button
          type="button"
          onClick={() => setSheetOpen((open) => !open)}
          aria-expanded={sheetOpen}
          aria-label={sheetOpen ? 'Collapse panel' : 'Expand panel'}
          className={`flex shrink-0 justify-center pt-2 lg:hidden ${focusRing}`}
        >
          <span aria-hidden className="h-1.5 w-10 rounded-full bg-ink-faint/50" />
        </button>
        <Tabs
          active={tab}
          onChange={(id) => {
            setTab(id);
            setSheetOpen(true);
          }}
          header={
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {presentation?.theme.logoUrl && (
                  <img
                    src={presentation.theme.logoUrl}
                    alt=""
                    className="mb-2 hidden h-6 w-auto lg:block"
                  />
                )}
                <h1
                  className={`truncate text-2xl leading-tight lg:text-3xl ${titleFontClass(presentation?.theme.font ?? 'instrument-serif')}`}
                >
                  {heading}
                </h1>
                <p className="mt-0.5 truncate text-xs text-ink-muted">
                  {!info
                    ? 'Loading model…'
                    : (config?.product.description ??
                      `${info.meshCount} parts · ${info.triangleCount.toLocaleString()} triangles`)}
                </p>
              </div>
              {info && info.animationNames.length > 0 && (
                <button
                  type="button"
                  onClick={() => viewer.current?.replayAnimations()}
                  aria-label="Replay animation"
                  title="Replay animation"
                  className={`grid size-9 shrink-0 place-items-center rounded-full bg-tint text-ink-soft hover:bg-tint-strong ${focusRing}`}
                >
                  <PlayIcon width={14} height={14} />
                </button>
              )}
            </div>
          }
          tabs={[
            {
              id: 'options',
              label: 'Options',
              content:
                config && current ? (
                  <>
                    <Notices notices={notices} onDismiss={() => setNotices([])} />
                    <OptionsPanel
                      config={config}
                      evaluation={current}
                      onChange={change}
                      {...(layout.options && { className: layout.options })}
                    />
                  </>
                ) : (
                  <div className="space-y-2 px-5 py-2" aria-busy>
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="h-16 animate-pulse rounded-2xl bg-tint" />
                    ))}
                  </div>
                ),
            },
            ...extraTabs,
          ]}
        />
        {config && current && (
          <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-line px-5 py-3">
            <PriceSummary evaluation={current} />
            <button
              type="button"
              disabled={changes === 0}
              onClick={() => {
                setEvaluation(evaluate(config, {}));
                setNotices([]);
              }}
              title={changes === 0 ? 'Original design' : `${changes} changed`}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-tint disabled:opacity-40 disabled:hover:bg-transparent ${focusRing}`}
            >
              <ResetIcon width={14} height={14} /> Reset
            </button>
          </footer>
        )}
      </aside>

      {children}
    </div>
  );
}

function PriceSummary({ evaluation }: { evaluation: Evaluation }) {
  const { price } = evaluation;
  const extras = price.lines.slice(1);
  return (
    <div className="min-w-0">
      <p className="text-xs text-ink-muted">Total</p>
      <p
        className="text-xl font-semibold tracking-tight text-ink tabular-nums"
        aria-live="polite"
        data-testid="price-total"
      >
        {formatPrice(price.total, price.currency)}
      </p>
      {extras.length > 0 && (
        <p
          className="truncate text-xs text-ink-muted"
          title={extras
            .map(
              (l) =>
                `${l.label} ${l.amount > 0 ? '+' : '−'}${formatPrice(Math.abs(l.amount), price.currency)}`,
            )
            .join('\n')}
        >
          Base {formatPrice(price.lines[0]?.amount ?? 0, price.currency)} + {extras.length} option
          {extras.length === 1 ? '' : 's'}
        </p>
      )}
    </div>
  );
}

/** Explains automatic changes made by the product's rules. */
function Notices({ notices, onDismiss }: { notices: Correction[]; onDismiss: () => void }) {
  return (
    <div role="status" aria-live="polite" className="px-5">
      {notices.length > 0 && (
        <div className="mb-3 flex items-start gap-3 rounded-2xl bg-brand-50 px-4 py-3 text-sm text-ink ring-1 ring-brand-200 dark:bg-brand-500/15 dark:ring-brand-500/30">
          <ul className="flex-1 space-y-1">
            {[...new Set(notices.map((n) => n.message))].map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className={`rounded-full p-1 text-ink-muted hover:bg-tint hover:text-ink ${focusRing}`}
          >
            <CloseIcon />
          </button>
        </div>
      )}
    </div>
  );
}
