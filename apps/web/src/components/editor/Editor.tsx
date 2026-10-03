'use client';

import { parseProductConfig } from '@twirl/config-schema';
import { evaluate, type ProductConfig } from '@twirl/config-schema/engine';
import type { CameraView, MeshOverrides, ModelInfo, ViewerHandle } from '@twirl/viewer';
import { Configurator, deformationsForSelections, overridesForSelections } from '@twirl/viewer/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  type ComponentType,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';

import {
  copyToDraftAction,
  makeLiveAction,
  publishAction,
  saveDraftAction,
  unpublishAction,
} from '@/app/dashboard/products/actions';
import { LazyViewer } from '@/components/demo/LazyViewer';
import { ENVIRONMENT_SOURCES } from '@/lib/environments';
import type { ConfigIssue } from '@/server/products';

import { meshChoices } from './config-edit';
import {
  AlertIcon,
  ArrowLeftIcon,
  CheckIcon,
  CubeIcon,
  EyeIcon,
  LinkIcon,
  SlidersIcon,
  SparklesIcon,
  TagIcon,
  XIcon,
} from './icons';
import { LookEditor } from './LookEditor';
import { OptionsEditor } from './OptionsEditor';
import { PartsEditor } from './PartsEditor';
import { RulesEditor } from './RulesEditor';
import { type VersionSummary, VersionsDrawer } from './VersionsDrawer';
import { Button, focusRing, MoneyField, SectionHeader, SelectField, TextField } from './ui';

export interface EditorProps {
  productId: string;
  initialConfig: ProductConfig;
  modelUrl: string;
  /** Published versions, newest first. */
  versions: VersionSummary[];
  /** The live version, if the product is published (its config as JSON, to spot changes). */
  live: { number: number; configJson: string } | null;
}

const CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'CAD',
  'AUD',
  'NZD',
  'CHF',
  'SEK',
  'NOK',
  'DKK',
  'JPY',
  'INR',
  'AED',
  'SGD',
].map((code) => ({ value: code, label: code }));

type SectionId = 'product' | 'parts' | 'options' | 'rules' | 'look';

const SECTIONS: {
  id: SectionId;
  label: string;
  icon: ComponentType<{ size?: number }>;
  paths: string[];
}[] = [
  { id: 'product', label: 'Product', icon: TagIcon, paths: ['product', 'pricing'] },
  { id: 'parts', label: 'Parts', icon: CubeIcon, paths: ['parts'] },
  { id: 'options', label: 'Options', icon: SlidersIcon, paths: ['groups'] },
  { id: 'rules', label: 'Rules', icon: LinkIcon, paths: ['rules'] },
  { id: 'look', label: 'Appearance', icon: SparklesIcon, paths: ['presentation', 'scene'] },
];

function sectionOf(path: string): SectionId {
  const root = path.split('.')[0] ?? '';
  return SECTIONS.find((s) => s.paths.includes(root))?.id ?? 'product';
}

const VIEWS: { view: CameraView; label: string; title: string }[] = [
  { view: 'front', label: 'Front', title: 'Front view' },
  { view: 'threeQuarter', label: '¾', title: 'Three-quarter view' },
  { view: 'side', label: 'Side', title: 'Side view' },
  { view: 'back', label: 'Back', title: 'Back view' },
  { view: 'top', label: 'Top', title: 'Top view' },
];

const NO_OVERRIDES: MeshOverrides = {};

function issuesOf(config: ProductConfig): ConfigIssue[] {
  const parsed = parseProductConfig(config);
  if (parsed.success) return [];
  const error = parsed.error;
  return 'issues' in error
    ? error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))
    : [{ path: '', message: error.message }];
}

const FIELD_NAMES: Record<string, string> = {
  label: 'title',
  swatches: 'colour',
  color: 'colour',
  originalLabel: 'original colour name',
  message: 'message',
  default: 'default',
  name: 'name',
  base: 'price',
  min: 'minimum',
  max: 'maximum',
  step: 'step',
  nativeSize: 'current size',
  behaviors: 'parts',
  meshes: 'model parts',
  parts: 'parts',
};

/** "groups.2.swatches.0.label" → "Seat fabric › choice 1 › name". */
function describePath(config: ProductConfig, path: string): string {
  const [section, index, ...rest] = path.split('.');
  const i = Number(index);
  const name =
    section === 'groups'
      ? config.groups[i]?.label || `Option ${i + 1}`
      : section === 'parts'
        ? config.parts[i]?.label || `Part ${i + 1}`
        : section === 'rules'
          ? `Rule ${i + 1}`
          : section === 'product'
            ? 'Product'
            : section === 'pricing'
              ? 'Pricing'
              : section;
  const tail: string[] = [];
  for (let k = 0; k < rest.length; k++) {
    const part = rest[k] ?? '';
    const next = rest[k + 1];
    if (next !== undefined && /^\d+$/.test(next)) {
      tail.push(`${FIELD_NAMES[part] ?? part} ${Number(next) + 1}`);
      k++;
    } else if (!/^\d+$/.test(part)) {
      tail.push(FIELD_NAMES[part] ?? part);
    }
  }
  return [name, ...tail].join(' › ');
}

/**
 * The product editor: forms on the left, the model with the current defaults on the right, and a
 * full shopper preview on demand. Edits stay local until saved; the config is validated as you go
 * and again on the server.
 */
export function Editor({ productId, initialConfig, modelUrl, versions, live }: EditorProps) {
  const [config, setConfig] = useState(initialConfig);
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(initialConfig));
  const [info, setInfo] = useState<ModelInfo | null>(null);
  const [section, setSection] = useState<SectionId>('parts');
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [problemsOpen, setProblemsOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const router = useRouter();
  const [saving, startSaving] = useTransition();
  const viewer = useRef<ViewerHandle>(null);
  const content = useRef<HTMLDivElement>(null);

  const issues = useMemo(() => issuesOf(config), [config]);
  const valid = issues.length === 0;
  const dirty = JSON.stringify(config) !== savedJson;
  const issuesBySection = useMemo(() => {
    const counts = new Map<SectionId, number>();
    for (const issue of issues) {
      const id = sectionOf(issue.path);
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  }, [issues]);

  // The preview always shows the last valid config, so a half-finished edit can't break it.
  const [previewConfig, setPreviewConfig] = useState(initialConfig);
  if (valid && previewConfig !== config) setPreviewConfig(config);

  const evaluation = useMemo(() => evaluate(previewConfig, {}), [previewConfig]);
  const meshOverrides = useMemo(
    () =>
      info
        ? overridesForSelections(previewConfig, evaluation.selections, info.meshTree)
        : NO_OVERRIDES,
    [info, previewConfig, evaluation],
  );
  const deformations = useMemo(
    () =>
      info ? deformationsForSelections(previewConfig, evaluation.selections, info.meshTree) : [],
    [info, previewConfig, evaluation],
  );
  const meshes = useMemo(() => (info ? meshChoices(info.meshTree) : null), [info]);

  const save = useCallback(() => {
    if (!valid || saving) return;
    const json = JSON.stringify(config);
    startSaving(async () => {
      const result = await saveDraftAction(productId, config);
      if (result.ok) {
        setSavedJson(json);
        setSaveError(null);
      } else {
        setSaveError(result.error);
      }
    });
  }, [config, productId, saving, valid]);

  const nextVersion = (versions[0]?.number ?? 0) + 1;
  const unpublished = live ? JSON.stringify(config) !== live.configJson : true;

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  /** Saves the current edits and publishes them as the next version. */
  const publish = () => {
    if (!valid || saving) return;
    const json = JSON.stringify(config);
    setConfirmPublish(false);
    startSaving(async () => {
      const result = await publishAction(productId, config);
      if (result.ok) {
        setSavedJson(json);
        setSaveError(null);
        setNotice(`Published. Version ${result.number} is live.`);
        router.refresh();
      } else {
        setSaveError(result.error);
      }
    });
  };

  const runVersionAction = (action: () => Promise<{ ok: boolean; error?: string }>, done: string) =>
    startSaving(async () => {
      const result = await action();
      if (result.ok) {
        setSaveError(null);
        setNotice(done);
        router.refresh();
      } else {
        setSaveError(result.error ?? 'Something went wrong.');
      }
    });

  const copyVersion = (versionId: string) =>
    startSaving(async () => {
      const result = await copyToDraftAction(productId, versionId);
      if (result.ok) {
        setConfig(result.config);
        setSavedJson(JSON.stringify(result.config));
        setHistoryOpen(false);
        setNotice('Version copied. Publish to make it live.');
      } else {
        setSaveError(result.error);
      }
    });

  const goToSection = (id: SectionId) => {
    setSection(id);
    content.current?.scrollTo({ top: 0 });
  };

  /** Jump from the problems list to where the problem is. */
  const goToIssue = (issue: ConfigIssue) => {
    const id = sectionOf(issue.path);
    setSection(id);
    setProblemsOpen(false);
    const [root, index] = issue.path.split('.');
    if (root === 'groups') {
      const group = config.groups[Number(index)];
      if (group) {
        // Sizes have their own cards; colour and show/hide live on their part's card.
        const part = group.type === 'dimension' ? undefined : group.parts[0];
        setOpenGroup(part ? `part:${part}` : group.id);
        const target = part ? `part-options-${part}` : `option-${group.id}`;
        requestAnimationFrame(() =>
          document.getElementById(target)?.scrollIntoView({ block: 'start', behavior: 'smooth' }),
        );
      }
    }
  };

  // Keyboard: Ctrl/Cmd+S saves; Esc closes the shopper preview or the problems list.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
      } else if (e.key === 'Escape') {
        setPreviewing(false);
        setProblemsOpen(false);
        setConfirmPublish(false);
        setHistoryOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save]);
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const saveTitle = !valid
    ? 'Fix the problems first'
    : !dirty
      ? 'No changes to save'
      : 'Save without publishing (Ctrl+S)';

  return (
    <div className="flex h-dvh flex-col bg-tint text-[15px] text-ink">
      {/* Top bar */}
      <header className="relative z-30 flex h-16 shrink-0 items-center gap-3 border-b border-line bg-surface px-4">
        <Link
          href="/dashboard"
          className={`flex h-10 items-center gap-2 rounded-lg px-3 text-[14px] font-medium text-ink-soft hover:bg-tint hover:text-ink ${focusRing}`}
        >
          <ArrowLeftIcon /> <span className="hidden sm:inline">All products</span>
        </Link>
        <span aria-hidden className="h-6 w-px bg-line" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[16px] font-semibold">
            {config.product.name || 'Untitled product'}
          </h1>
          <p className="flex items-center gap-1.5 text-[13px]" role="status">
            {live ? (
              <span className="rounded bg-emerald-100 px-1.5 py-px text-[11px] font-semibold tracking-wide text-emerald-800 uppercase dark:bg-emerald-500/20 dark:text-emerald-200">
                Live · v{live.number}
              </span>
            ) : (
              <span className="rounded bg-amber-100 px-1.5 py-px text-[11px] font-semibold tracking-wide text-amber-900 uppercase dark:bg-amber-500/20 dark:text-amber-100">
                Not live
              </span>
            )}
            {saving ? (
              <span className="text-ink-muted">Saving…</span>
            ) : saveError ? (
              <span className="text-red-600 dark:text-red-400">{saveError}</span>
            ) : dirty ? (
              <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                <span aria-hidden className="size-1.5 rounded-full bg-amber-500" /> Unsaved changes
              </span>
            ) : live && unpublished ? (
              <span className="text-ink-muted">Saved, not published</span>
            ) : live ? (
              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                <CheckIcon size={13} /> Published
              </span>
            ) : (
              <span className="flex items-center gap-1 text-ink-muted">
                <CheckIcon size={13} /> Saved
              </span>
            )}
          </p>
        </div>

        {issues.length > 0 && (
          <div className="relative">
            <button
              type="button"
              aria-expanded={problemsOpen}
              onClick={() => setProblemsOpen((v) => !v)}
              className={`flex h-10 items-center gap-2 rounded-lg bg-red-50 px-3 text-[14px] font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30 ${focusRing}`}
            >
              <AlertIcon />
              {issues.length} thing{issues.length === 1 ? '' : 's'} to fix
            </button>
            {problemsOpen && (
              <div className="absolute top-12 right-0 w-[min(92vw,26rem)] overflow-hidden rounded-xl bg-surface shadow-[0_16px_48px_-12px_rgba(0,0,0,0.35)] ring-1 ring-line">
                <p className="border-b border-line px-4 py-3 text-[13px] text-ink-muted">
                  Click a problem to go to it.
                </p>
                <ul className="max-h-80 overflow-y-auto py-1">
                  {issues.map((issue) => (
                    <li key={`${issue.path}:${issue.message}`}>
                      <button
                        type="button"
                        onClick={() => goToIssue(issue)}
                        className="block w-full px-4 py-2.5 text-left hover:bg-tint"
                      >
                        <span className="block text-[13px] font-medium text-ink">
                          {describePath(config, issue.path)}
                        </span>
                        <span className="block text-[13px] text-red-600 dark:text-red-400">
                          {issue.message}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        <Button onClick={() => setPreviewing(true)} title="See what shoppers see">
          <EyeIcon /> <span className="hidden md:inline">Try as a shopper</span>
        </Button>
        <Button onClick={() => setHistoryOpen(true)} title="Published versions">
          <span className="hidden md:inline">Versions</span>
          <span className="md:hidden">v</span>
        </Button>
        <Button onClick={save} disabled={!valid || !dirty || saving} title={saveTitle}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <div className="relative">
          <Button
            variant="primary"
            onClick={() => setConfirmPublish((v) => !v)}
            disabled={!valid || saving || (!unpublished && !dirty)}
            title={
              !valid
                ? 'Fix the problems first'
                : !unpublished && !dirty
                  ? 'Already published'
                  : 'Make your changes visible to shoppers'
            }
            aria-expanded={confirmPublish}
          >
            Publish
          </Button>
          {confirmPublish && (
            <div className="absolute top-12 right-0 w-80 rounded-xl bg-surface p-4 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.35)] ring-1 ring-line">
              <p className="text-[15px] font-semibold text-ink">Publish version {nextVersion}?</p>
              <p className="mt-1 text-[14px] text-ink-muted">
                {live
                  ? 'Shoppers will see your changes right away.'
                  : 'Shoppers will be able to see this product.'}
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setConfirmPublish(false)}>
                  Cancel
                </Button>
                <Button size="sm" variant="primary" onClick={publish}>
                  Publish now
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col-reverse lg:flex-row">
        {/* Editing panel */}
        <aside
          aria-label="Edit product"
          className="flex min-h-0 flex-1 flex-col border-line bg-surface lg:w-[500px] lg:flex-none lg:border-r xl:w-[560px]"
        >
          <nav aria-label="Editor sections" className="shrink-0 border-b border-line px-3 pt-2">
            <ul className="flex">
              {SECTIONS.map(({ id, label, icon: Icon }, step) => {
                const active = section === id;
                const problems = issuesBySection.get(id) ?? 0;
                const count =
                  id === 'parts'
                    ? config.parts.length
                    : id === 'options'
                      ? config.groups.length
                      : id === 'rules'
                        ? config.rules.length
                        : null;
                return (
                  <li key={id} className="flex-1">
                    <button
                      type="button"
                      aria-current={active ? 'page' : undefined}
                      onClick={() => goToSection(id)}
                      className={`relative flex w-full flex-col items-center gap-1 rounded-t-lg px-1 pt-2 pb-2.5 text-[13px] font-medium transition-colors ${active ? 'text-brand-700 dark:text-brand-200' : 'text-ink-muted hover:bg-tint hover:text-ink'} ${focusRing}`}
                    >
                      <span className="relative">
                        <Icon size={20} />
                        {problems > 0 && (
                          <span
                            className="absolute -top-1 -right-1.5 size-2.5 rounded-full bg-red-500 ring-2 ring-surface"
                            title={`${problems} problem${problems === 1 ? '' : 's'}`}
                          />
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-ink-faint">{step + 1}.</span> {label}
                        {count !== null && (
                          <span className="rounded-full bg-tint-strong px-1.5 text-[11px] text-ink-soft tabular-nums">
                            {count}
                          </span>
                        )}
                      </span>
                      {active && (
                        <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-brand-600" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div ref={content} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {section === 'product' && (
              <div className="space-y-6 p-6">
                <SectionHeader title="Product" description="Name, description and price." />
                <TextField
                  label="Product name"
                  value={config.product.name}
                  maxLength={120}
                  onChange={(name) => setConfig((c) => ({ ...c, product: { ...c.product, name } }))}
                  error={config.product.name.trim() ? undefined : 'Give your product a name.'}
                />
                <TextField
                  label="Description (optional)"
                  multiline
                  value={config.product.description ?? ''}
                  maxLength={2000}
                  onChange={(description) =>
                    setConfig((c) => {
                      const { description: _, ...product } = c.product;
                      return { ...c, product: description ? { ...product, description } : product };
                    })
                  }
                />
                <div className="grid grid-cols-[8rem_1fr] gap-3">
                  <SelectField
                    label="Currency"
                    value={config.pricing.currency}
                    options={
                      CURRENCIES.some((c) => c.value === config.pricing.currency)
                        ? CURRENCIES
                        : [
                            { value: config.pricing.currency, label: config.pricing.currency },
                            ...CURRENCIES,
                          ]
                    }
                    onChange={(currency) =>
                      setConfig((c) => ({ ...c, pricing: { ...c.pricing, currency } }))
                    }
                  />
                  <MoneyField
                    label="Price"
                    help="The price before any extra costs from options."
                    currency={config.pricing.currency}
                    value={config.pricing.base}
                    allowNegative={false}
                    onChange={(base) =>
                      setConfig((c) => ({ ...c, pricing: { ...c.pricing, base } }))
                    }
                  />
                </div>
              </div>
            )}
            {section === 'parts' && (
              <PartsEditor
                config={config}
                meshes={meshes}
                issues={issues}
                onChange={setConfig}
                onHighlight={setHighlighted}
              />
            )}
            {section === 'options' && (
              <OptionsEditor
                config={config}
                issues={issues}
                onChange={setConfig}
                openId={openGroup}
                onOpen={setOpenGroup}
              />
            )}
            {section === 'rules' && (
              <RulesEditor config={config} issues={issues} onChange={setConfig} />
            )}
            {section === 'look' && <LookEditor config={config} onChange={setConfig} />}
          </div>
        </aside>

        {/* Live preview */}
        <section aria-label="Preview" className="relative h-[42svh] shrink-0 lg:h-auto lg:flex-1">
          <LazyViewer
            ref={viewer}
            modelUrl={modelUrl}
            scene={previewConfig.scene}
            environmentSources={ENVIRONMENT_SOURCES}
            meshOverrides={meshOverrides}
            deformations={deformations}
            highlightedMeshId={highlighted}
            initialView={previewConfig.presentation.camera.initialView}
            onLoad={setInfo}
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
            <span className="pointer-events-auto flex items-center gap-2 rounded-full bg-surface/90 py-1.5 pr-2 pl-3.5 text-[13px] font-medium text-ink-soft shadow-sm ring-1 ring-line backdrop-blur">
              {valid ? 'Preview' : 'Fix the problems to update the preview'}
            </span>
          </div>
          {info && (
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-surface/90 p-1 shadow-sm ring-1 ring-line backdrop-blur">
              {VIEWS.map(({ view, label, title }) => (
                <button
                  key={view}
                  type="button"
                  title={title}
                  aria-label={title}
                  onClick={() => viewer.current?.setView(view)}
                  className={`h-8 rounded-full px-3 text-[13px] font-medium text-ink-soft hover:bg-tint-strong hover:text-ink ${focusRing}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {notice && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[14px] text-surface shadow-lg"
        >
          <CheckIcon size={15} /> {notice}
        </div>
      )}

      {historyOpen && (
        <VersionsDrawer
          versions={versions}
          dirty={dirty}
          busy={saving}
          onClose={() => setHistoryOpen(false)}
          onUnpublish={() =>
            runVersionAction(
              () => unpublishAction(productId),
              'Unpublished. Shoppers can no longer see this product.',
            )
          }
          onMakeLive={(versionId) =>
            runVersionAction(
              () => makeLiveAction(productId, versionId),
              'That version is live again.',
            )
          }
          onCopyToDraft={copyVersion}
        />
      )}

      {previewing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Shopper preview"
          className="fixed inset-0 z-50 bg-surface"
        >
          <Configurator
            config={previewConfig}
            modelUrl={modelUrl}
            Viewer={LazyViewer}
            viewerProps={{ environmentSources: ENVIRONMENT_SOURCES }}
          />
          <div className="absolute top-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3 rounded-full bg-ink py-1.5 pr-1.5 pl-4 text-[13px] text-surface shadow-lg">
            Shopper preview
            <button
              type="button"
              onClick={() => setPreviewing(false)}
              className="flex items-center gap-1.5 rounded-full bg-surface/15 px-3 py-1.5 font-medium hover:bg-surface/25"
            >
              <XIcon size={14} /> Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
