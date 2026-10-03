'use client';

import type { ProductConfig } from '@twirl/config-schema/engine';

import { ScenePanel } from '@/components/demo/ScenePanel';

import { ColorField, Field, SelectField, TextField } from './fields';

export interface LookEditorProps {
  config: ProductConfig;
  onChange: (config: ProductConfig) => void;
}

const LAYOUTS = [
  { value: 'sidebar', label: 'Sidebar: options beside the model' },
  { value: 'bottomBar', label: 'Bottom bar: options below the model' },
  { value: 'fullscreen', label: 'Fullscreen: options float over the model' },
] as const;

const FONTS = [
  { value: 'geist', label: 'Geist (clean sans-serif)' },
  { value: 'instrument-serif', label: 'Instrument Serif (elegant serif)' },
] as const;

const VIEWS = [
  { value: 'threeQuarter', label: 'Three-quarter' },
  { value: 'front', label: 'Front' },
  { value: 'side', label: 'Side' },
  { value: 'back', label: 'Back' },
  { value: 'top', label: 'Top' },
] as const;

/** How the configurator looks: layout, brand colour, font, logo, first camera view and scene. */
export function LookEditor({ config, onChange }: LookEditorProps) {
  const presentation = config.presentation;
  const setPresentation = (patch: Partial<ProductConfig['presentation']>) =>
    onChange({ ...config, presentation: { ...presentation, ...patch } });
  const setTheme = (patch: Partial<ProductConfig['presentation']['theme']>) =>
    setPresentation({ theme: { ...presentation.theme, ...patch } });

  return (
    <div>
      <div className="space-y-4 p-5">
        <SelectField
          label="Layout"
          value={presentation.layout}
          options={LAYOUTS}
          onChange={(layout) => setPresentation({ layout })}
        />
        <Field label="Accent colour" hint="Buttons, selected swatches and highlights.">
          {() => (
            <ColorField
              label="Accent"
              value={presentation.theme.accent}
              onChange={(accent) => setTheme({ accent })}
            />
          )}
        </Field>
        <SelectField
          label="Heading font"
          value={presentation.theme.font}
          options={FONTS}
          onChange={(font) => setTheme({ font })}
        />
        <TextField
          label="Logo URL (optional)"
          hint="A link to an image of your logo (https://…). Uploading logos comes later."
          placeholder="https://example.com/logo.svg"
          maxLength={500}
          value={presentation.theme.logoUrl ?? ''}
          onChange={(url) => {
            const { logoUrl: _, ...theme } = presentation.theme;
            setPresentation({ theme: url ? { ...theme, logoUrl: url } : theme });
          }}
        />
        <SelectField
          label="First camera view"
          value={presentation.camera.initialView}
          options={VIEWS}
          onChange={(initialView) => setPresentation({ camera: { initialView } })}
        />
      </div>
      <div className="border-t border-line">
        <ScenePanel
          scene={config.scene}
          onChange={(scene) => onChange({ ...config, scene })}
          lightingLoading={false}
        />
      </div>
    </div>
  );
}
