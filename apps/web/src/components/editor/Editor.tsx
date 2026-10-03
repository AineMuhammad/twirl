'use client';

import { parseProductConfig } from '@twirl/config-schema';
import { evaluate, type ProductConfig } from '@twirl/config-schema/engine';
import type { MeshOverrides, ModelInfo } from '@twirl/viewer';
import {
  CloseIcon,
  Configurator,
  deformationsForSelections,
  overridesForSelections,
  partNodeIds,
  Tabs,
} from '@twirl/viewer/ui';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';

import { saveDraftAction } from '@/app/dashboard/products/actions';
import { LazyViewer } from '@/components/demo/LazyViewer';
import { ENVIRONMENT_SOURCES } from '@/lib/environments';
import type { ConfigIssue } from '@/server/products';

import { meshChoices } from './config-edit';
import { MoneyField, SelectField, TextField } from './fields';
import { LookEditor } from './LookEditor';
import { OptionsEditor } from './OptionsEditor';
import { PartsEditor } from './PartsEditor';
import { RulesEditor } from './RulesEditor';

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

export interface EditorProps {
  productId: string;
  initialConfig: ProductConfig;
  modelUrl: string;
}

const NO_OVERRIDES: MeshOverrides = {};

function issuesOf(config: ProductConfig): ConfigIssue[] {
  const parsed = parseProductConfig(config);
  if (parsed.success) return [];
  const error = parsed.error;
  return 'issues' in error
    ? error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))
    : [{ path: '', message: error.message }];
}

/** "groups.2.swatches.0.label" → "Seat fabric › swatch 1 › label". */
function describePath(config: ProductConfig, path: string): string {
  const [section, index, ...rest] = path.split('.');
  const i = Number(index);
  const name =
    section === 'groups'
      ? config.groups[i]?.label
      : section === 'parts'
        ? config.parts[i]?.label
        : section === 'product'
          ? 'Product'
          : undefined;
  const tail = rest.map((p) => (/^\d+$/.test(p) ? `#${Number(p) + 1}` : p)).join(' › ');
  return [name ?? section, tail].filter(Boolean).join(' › ');
}

/**
 * The product editor: forms on the left, the model with the current defaults on the right, and a
 * full shopper preview on demand. Edits stay local until saved; the config is validated as you go
 * and again on the server.
 */
export function Editor({ productId, initialConfig, modelUrl }: EditorProps) {
  const [config, setConfig] = useState(initialConfig);
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(initialConfig));
  const [info, setInfo] = useState<ModelInfo | null>(null);
  const [tab, setTab] = useState('parts');
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  const issues = useMemo(() => issuesOf(config), [config]);
  const valid = issues.length === 0;
  const dirty = JSON.stringify(config) !== savedJson;

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
  const highlighted = useMemo(() => {
    if (!info || !hoveredPart) return null;
    return partNodeIds(config, info.meshTree).get(hoveredPart)?.[0] ?? null;
  }, [info, hoveredPart, config]);
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

  // Ctrl/Cmd+S saves; leaving with unsaved changes asks first.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save]);
  useEffect(() => {
    if (!previewing) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPreviewing(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previewing]);
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const status = saving
    ? 'Saving…'
    : saveError
      ? saveError
      : !valid
        ? `${issues.length} problem${issues.length === 1 ? '' : 's'} to fix`
        : dirty
          ? 'Unsaved changes'
          : 'All changes saved';

  return (
    <div className="flex h-dvh flex-col bg-tint text-ink">
      <header className="flex shrink-0 items-center gap-3 border-b border-line bg-surface px-4 py-2.5">
        <Link
          href="/dashboard"
          className="rounded-md px-2 py-1 text-sm text-ink-soft hover:bg-tint hover:text-ink"
        >
          ← Dashboard
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold">{config.product.name || 'Untitled'}</h1>
          <p
            role="status"
            className={`text-xs ${saveError || !valid ? 'text-red-600 dark:text-red-400' : 'text-ink-muted'}`}
          >
            Draft · {status}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPreviewing(true)}
          className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-tint"
        >
          Preview as shopper
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!valid || !dirty || saving}
          className="rounded-lg bg-brand-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save draft'}
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col-reverse lg:flex-row">
        <aside
          aria-label="Edit product"
          className="flex min-h-0 flex-1 flex-col border-line bg-surface lg:w-[440px] lg:flex-none lg:border-r"
        >
          {issues.length > 0 && (
            <div className="max-h-32 shrink-0 overflow-y-auto border-b border-line bg-red-50 px-5 py-2.5 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300">
              <ul className="space-y-0.5">
                {issues.slice(0, 8).map((issue) => (
                  <li key={`${issue.path}:${issue.message}`}>
                    <span className="font-medium">{describePath(config, issue.path)}:</span>{' '}
                    {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Tabs
            active={tab}
            onChange={setTab}
            tabs={[
              {
                id: 'product',
                label: 'Product',
                content: (
                  <div className="space-y-4 p-5">
                    <TextField
                      label="Product name"
                      value={config.product.name}
                      maxLength={120}
                      onChange={(name) =>
                        setConfig((c) => ({ ...c, product: { ...c.product, name } }))
                      }
                    />
                    <TextField
                      label="Short description (optional)"
                      value={config.product.description ?? ''}
                      maxLength={2000}
                      onChange={(description) =>
                        setConfig((c) => {
                          const { description: _, ...product } = c.product;
                          return {
                            ...c,
                            product: description ? { ...product, description } : product,
                          };
                        })
                      }
                    />
                    <div className="grid grid-cols-2 gap-2">
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
                        label="Base price"
                        currency={config.pricing.currency}
                        value={config.pricing.base}
                        allowNegative={false}
                        onChange={(base) =>
                          setConfig((c) => ({ ...c, pricing: { ...c.pricing, base } }))
                        }
                      />
                    </div>
                    <p className="text-xs text-ink-faint">
                      The price of the default configuration. Option prices add to or subtract from
                      it.
                    </p>
                  </div>
                ),
              },
              {
                id: 'parts',
                label: 'Parts',
                content: (
                  <PartsEditor
                    config={config}
                    meshes={meshes}
                    onChange={setConfig}
                    onHover={setHoveredPart}
                  />
                ),
              },
              {
                id: 'options',
                label: 'Options',
                content: <OptionsEditor config={config} onChange={setConfig} />,
              },
              {
                id: 'rules',
                label: 'Rules',
                content: <RulesEditor config={config} onChange={setConfig} />,
              },
              {
                id: 'look',
                label: 'Look',
                content: <LookEditor config={config} onChange={setConfig} />,
              },
            ]}
          />
        </aside>

        <section aria-label="Preview" className="relative h-[45svh] shrink-0 lg:h-auto lg:flex-1">
          <LazyViewer
            modelUrl={modelUrl}
            scene={previewConfig.scene}
            environmentSources={ENVIRONMENT_SOURCES}
            meshOverrides={meshOverrides}
            deformations={deformations}
            highlightedMeshId={highlighted}
            initialView={previewConfig.presentation.camera.initialView}
            onLoad={setInfo}
          />
          {!valid && (
            <p className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-surface/90 px-3 py-1 text-xs text-ink-muted ring-1 ring-line">
              Showing the last valid version
            </p>
          )}
        </section>
      </div>

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
          <button
            type="button"
            onClick={() => setPreviewing(false)}
            className="absolute top-3 left-3 z-20 flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-sm font-medium text-surface shadow-lg"
          >
            <CloseIcon /> Close preview
          </button>
        </div>
      )}
    </div>
  );
}
