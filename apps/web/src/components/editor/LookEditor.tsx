'use client';

import type { ProductConfig } from '@twirl/config-schema/engine';
import type { ReactNode } from 'react';

import { ScenePanel } from '@/components/demo/ScenePanel';

import { CheckIcon } from './icons';
import {
  Button,
  ColorInput,
  Field,
  focusRing,
  SectionHeader,
  Segmented,
  Subsection,
  TextField,
} from './ui';

export interface LookEditorProps {
  config: ProductConfig;
  onChange: (config: ProductConfig) => void;
  /** The preview camera's current angle (degrees), to use as the model's front. */
  onCaptureFront: () => number | null;
}

type Layout = ProductConfig['presentation']['layout'];

/** Tiny diagrams of each layout: stage (grey) and options panel (brand). */
const LAYOUTS: { value: Layout; label: string; blurb: string; diagram: ReactNode }[] = [
  {
    value: 'sidebar',
    label: 'Sidebar',
    blurb: 'Options beside the product',
    diagram: (
      <>
        <rect x="2" y="2" width="38" height="36" rx="3" className="fill-ink-faint/30" />
        <rect x="42" y="2" width="16" height="36" rx="3" className="fill-brand-500" />
      </>
    ),
  },
  {
    value: 'bottomBar',
    label: 'Bottom bar',
    blurb: 'Options under the product',
    diagram: (
      <>
        <rect x="2" y="2" width="56" height="24" rx="3" className="fill-ink-faint/30" />
        <rect x="2" y="28" width="56" height="10" rx="3" className="fill-brand-500" />
      </>
    ),
  },
  {
    value: 'fullscreen',
    label: 'Fullscreen',
    blurb: 'Options float over the product',
    diagram: (
      <>
        <rect x="2" y="2" width="56" height="36" rx="3" className="fill-ink-faint/30" />
        <rect x="40" y="6" width="15" height="28" rx="3" className="fill-brand-500" />
      </>
    ),
  },
];

const ACCENTS = [
  '#c2552d',
  '#1c1917',
  '#4d6b50',
  '#8a5a2b',
  '#2f4858',
  '#9a3b55',
  '#b08d57',
  '#3d5a80',
];

const FONTS = [
  { value: 'geist', label: 'Modern', sample: 'font-sans font-semibold' },
  { value: 'instrument-serif', label: 'Elegant', sample: 'font-serif' },
] as const;

const VIEWS = [
  { value: 'front', label: 'Front' },
  { value: 'threeQuarter', label: '¾', title: 'Three-quarter' },
  { value: 'side', label: 'Side' },
  { value: 'back', label: 'Back' },
  { value: 'top', label: 'Top' },
] as const;

function Tile({
  selected,
  onClick,
  children,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      onClick={onClick}
      className={`relative flex flex-col items-start gap-2 rounded-xl border-2 bg-surface p-3 text-left transition-colors ${selected ? 'border-brand-500' : 'border-line hover:border-ink-faint/50'} ${focusRing}`}
    >
      {selected && (
        <span className="absolute top-2 right-2 grid size-5 place-items-center rounded-full bg-brand-600 text-white">
          <CheckIcon size={12} />
        </span>
      )}
      {children}
    </button>
  );
}

/** How the configurator looks: layout, brand colour, font, logo, first camera view and scene. */
export function LookEditor({ config, onChange, onCaptureFront }: LookEditorProps) {
  const presentation = config.presentation;
  const setPresentation = (patch: Partial<ProductConfig['presentation']>) =>
    onChange({ ...config, presentation: { ...presentation, ...patch } });
  const setTheme = (patch: Partial<ProductConfig['presentation']['theme']>) =>
    setPresentation({ theme: { ...presentation.theme, ...patch } });
  const logoUrl = presentation.theme.logoUrl ?? '';
  const logoInvalid = logoUrl !== '' && !/^https?:\/\/\S+$/.test(logoUrl);

  return (
    <div>
      <div className="space-y-8 p-6">
        <SectionHeader title="Appearance" description="Match the configurator to your brand." />

        <Subsection title="Layout">
          <div role="radiogroup" aria-label="Layout" className="grid grid-cols-3 gap-2">
            {LAYOUTS.map((l) => (
              <Tile
                key={l.value}
                label={`${l.label}: ${l.blurb}`}
                selected={presentation.layout === l.value}
                onClick={() => setPresentation({ layout: l.value })}
              >
                <svg viewBox="0 0 60 40" className="w-full" aria-hidden>
                  {l.diagram}
                </svg>
                <span>
                  <span className="block text-[14px] font-medium text-ink">{l.label}</span>
                  <span className="block text-[12px] leading-snug text-ink-muted">{l.blurb}</span>
                </span>
              </Tile>
            ))}
          </div>
        </Subsection>

        <Subsection title="Brand colour">
          <div
            className="flex flex-wrap items-center gap-2"
            role="radiogroup"
            aria-label="Brand colour presets"
          >
            {ACCENTS.map((hex) => {
              const selected = presentation.theme.accent === hex;
              return (
                <button
                  key={hex}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={hex}
                  title={hex}
                  onClick={() => setTheme({ accent: hex })}
                  className={`grid size-9 place-items-center rounded-full text-white transition-transform hover:scale-110 ${selected ? 'ring-2 ring-ink ring-offset-2 ring-offset-surface' : ''} ${focusRing}`}
                  style={{ background: hex }}
                >
                  {selected && <CheckIcon size={14} />}
                </button>
              );
            })}
          </div>
          <Field label="Custom">
            {() => (
              <ColorInput
                label="Brand colour"
                value={presentation.theme.accent}
                onChange={(accent) => setTheme({ accent })}
              />
            )}
          </Field>
        </Subsection>

        <Subsection title="Font">
          <div role="radiogroup" aria-label="Heading font" className="grid grid-cols-2 gap-2">
            {FONTS.map((f) => (
              <Tile
                key={f.value}
                label={`${f.label} font`}
                selected={presentation.theme.font === f.value}
                onClick={() => setTheme({ font: f.value })}
              >
                <span className={`text-3xl leading-none text-ink ${f.sample}`}>Aa</span>
                <span className="text-[14px] font-medium text-ink">{f.label}</span>
              </Tile>
            ))}
          </div>
        </Subsection>

        <Subsection title="Logo">
          <TextField
            label="Logo URL (optional)"
            placeholder="https://yourstore.com/logo.svg"
            maxLength={500}
            value={logoUrl}
            error={logoInvalid ? 'Enter a full link starting with https://' : undefined}
            onChange={(url) => {
              const { logoUrl: _, ...theme } = presentation.theme;
              setPresentation({ theme: url ? { ...theme, logoUrl: url } : theme });
            }}
          />
        </Subsection>

        <Subsection title="Starting view">
          <Segmented
            label="First camera view"
            value={presentation.camera.initialView}
            options={VIEWS}
            onChange={(initialView) =>
              setPresentation({ camera: { ...presentation.camera, initialView } })
            }
          />
        </Subsection>

        <Subsection
          title="Front of the model"
          help="Some 3D files face sideways. Turn the preview so you're looking at the front of your product, then set it. All preset views use it."
        >
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => {
                const azimuth = onCaptureFront();
                if (azimuth !== null)
                  setPresentation({ camera: { ...presentation.camera, frontAzimuth: azimuth } });
              }}
            >
              Set current view as front
            </Button>
            {presentation.camera.frontAzimuth !== 0 && (
              <Button
                variant="ghost"
                onClick={() =>
                  setPresentation({ camera: { ...presentation.camera, frontAzimuth: 0 } })
                }
              >
                Reset
              </Button>
            )}
          </div>
        </Subsection>
      </div>

      <div className="border-t border-line pt-2">
        <div className="px-6 pt-4">
          <h3 className="text-[13px] font-semibold tracking-wide text-ink-soft uppercase">Scene</h3>
          <p className="mt-1 text-[14px] text-ink-muted">Lighting and background.</p>
        </div>
        <ScenePanel
          scene={config.scene}
          onChange={(scene) => onChange({ ...config, scene })}
          lightingLoading={false}
        />
      </div>
    </div>
  );
}
