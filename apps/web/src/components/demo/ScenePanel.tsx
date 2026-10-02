'use client';

import {
  backgroundCss,
  ENVIRONMENT_IDS,
  ENVIRONMENTS,
  LIGHTING_PRESETS,
  type SceneSettings,
} from '@twirl/viewer/settings';
import { useState } from 'react';

import {
  BACKGROUND_PRESETS,
  LIGHTING_TONES,
  PROCEDURAL_LABELS,
  sameBackground,
} from '@/lib/scene-presets';

import { ColorPicker } from './ColorPicker';
import { CheckBadge, focusRing, RAINBOW, SectionTitle, Switch } from './ui';

export interface ScenePanelProps {
  scene: SceneSettings;
  onChange: (scene: SceneSettings) => void;
  /** True while the chosen HDRI lighting is still loading. */
  lightingLoading: boolean;
}

function LightingTile({
  label,
  tones,
  pressed,
  loading,
  onClick,
}: {
  label: string;
  tones: [string, string];
  pressed: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-busy={loading}
      onClick={onClick}
      className={`group relative aspect-[5/3] overflow-hidden rounded-2xl text-left transition-shadow ${focusRing} ${pressed ? 'ring-2 ring-brand-600 ring-offset-2' : 'ring-1 ring-black/[0.06] hover:ring-black/20'}`}
      style={{ background: `radial-gradient(120% 90% at 25% 15%, ${tones[0]}, ${tones[1]})` }}
    >
      <span className="absolute inset-x-2 bottom-2 flex items-center justify-between">
        <span className="rounded-full bg-white/85 px-2.5 py-1 text-xs font-medium text-neutral-900 backdrop-blur">
          {label}
        </span>
        {pressed &&
          (loading ? (
            <span
              aria-hidden
              className="size-5 animate-spin rounded-full border-2 border-white/60 border-t-brand-600"
            />
          ) : (
            <CheckBadge />
          ))}
      </span>
    </button>
  );
}

export function ScenePanel({ scene, onChange, lightingLoading }: ScenePanelProps) {
  const set = (patch: Partial<SceneSettings>) => onChange({ ...scene, ...patch });
  const [customOpen, setCustomOpen] = useState(false);
  const isPreset = BACKGROUND_PRESETS.some((p) => sameBackground(p.background, scene.background));
  const customColor = scene.background.type === 'solid' ? scene.background.color : '#f1f1f2';

  return (
    <div className="space-y-8 px-5 pb-6">
      <section>
        <SectionTitle hint="Instant">Studio light</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {LIGHTING_PRESETS.map((preset) => (
            <LightingTile
              key={preset}
              label={PROCEDURAL_LABELS[preset]}
              tones={LIGHTING_TONES[preset]}
              pressed={scene.lighting === preset}
              loading={false}
              onClick={() => set({ lighting: preset })}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle hint="Real places, lighting only">Environment</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {ENVIRONMENT_IDS.map((id) => (
            <LightingTile
              key={id}
              label={ENVIRONMENTS[id].label}
              tones={LIGHTING_TONES[id]}
              pressed={scene.lighting === id}
              loading={scene.lighting === id && lightingLoading}
              onClick={() => set({ lighting: id })}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Background</SectionTitle>
        <div role="group" aria-label="Background presets" className="flex flex-wrap gap-3">
          {BACKGROUND_PRESETS.map((preset) => {
            const active = sameBackground(scene.background, preset.background);
            return (
              <button
                key={preset.name}
                type="button"
                aria-label={preset.name}
                aria-pressed={active}
                title={preset.name}
                onClick={() => {
                  set({ background: preset.background });
                  setCustomOpen(false);
                }}
                className={`grid size-11 place-items-center rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] transition-transform hover:scale-105 ${focusRing} ${active ? 'ring-2 ring-brand-600 ring-offset-2' : ''}`}
                style={{ background: backgroundCss(preset.background) }}
              >
                {active && <CheckBadge />}
              </button>
            );
          })}
          <button
            type="button"
            aria-label="Custom background"
            aria-expanded={customOpen}
            aria-pressed={!isPreset}
            title="Custom background"
            onClick={() => setCustomOpen((v) => !v)}
            className={`grid size-11 place-items-center rounded-full transition-transform hover:scale-105 ${focusRing} ${!isPreset || customOpen ? 'ring-2 ring-brand-600 ring-offset-2' : ''}`}
            style={{ background: isPreset ? RAINBOW : customColor }}
          >
            {isPreset && (
              <span
                aria-hidden
                className="text-lg leading-none font-semibold text-white drop-shadow"
              >
                +
              </span>
            )}
          </button>
        </div>
        {customOpen && (
          <ColorPicker
            label="the background"
            color={customColor}
            onChange={(hex) => set({ background: { type: 'solid', color: hex } })}
            onDone={() => setCustomOpen(false)}
          />
        )}
      </section>

      <section>
        <SectionTitle>Ground</SectionTitle>
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-1">
          <Switch
            label="Floor"
            description="A soft ground under the product"
            checked={scene.floor}
            onChange={(floor) => set({ floor })}
          />
          <Switch
            label="Shadows"
            description="Cast from the main light"
            checked={scene.shadows}
            onChange={(shadows) => set({ shadows })}
          />
        </div>
      </section>
    </div>
  );
}
