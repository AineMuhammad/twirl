'use client';

import {
  ENVIRONMENT_IDS,
  ENVIRONMENTS,
  LIGHTING_PRESETS,
  type SceneBackground,
  type SceneSettings,
} from '@twirl/viewer/settings';

import {
  BACKGROUND_PRESETS,
  LIGHTING_TONES,
  PROCEDURAL_LABELS,
  sameBackground,
} from '@/lib/scene-presets';

import { CheckIcon } from './icons';
import { focusRing, SectionTitle, Switch } from './ui';

export interface ScenePanelProps {
  scene: SceneSettings;
  onChange: (scene: SceneSettings) => void;
}

function LightingCard({
  label,
  tones,
  pressed,
  onClick,
}: {
  label: string;
  tones: [string, string];
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`group flex items-center gap-2.5 rounded-xl p-1.5 pr-3 text-left text-sm transition-colors ${focusRing} ${pressed ? 'bg-neutral-900 text-white' : 'bg-neutral-900/[0.04] text-neutral-800 hover:bg-neutral-900/[0.07]'}`}
    >
      <span
        aria-hidden
        className="size-8 shrink-0 rounded-lg shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]"
        style={{ background: `linear-gradient(135deg, ${tones[0]}, ${tones[1]})` }}
      />
      <span className="truncate font-medium">{label}</span>
    </button>
  );
}

function backgroundPaint(bg: SceneBackground) {
  return bg.type === 'solid' ? bg.color : `linear-gradient(${bg.from}, ${bg.to})`;
}

export function ScenePanel({ scene, onChange }: ScenePanelProps) {
  const set = (patch: Partial<SceneSettings>) => onChange({ ...scene, ...patch });
  const customColor = scene.background.type === 'solid' ? scene.background.color : '#ffffff';
  const isPreset = BACKGROUND_PRESETS.some((p) => sameBackground(p.background, scene.background));

  return (
    <div className="space-y-6 px-4 pb-5">
      <section>
        <SectionTitle hint="Instant">Studio lighting</SectionTitle>
        <div className="grid grid-cols-2 gap-1.5">
          {LIGHTING_PRESETS.map((preset) => (
            <LightingCard
              key={preset}
              label={PROCEDURAL_LABELS[preset]}
              tones={LIGHTING_TONES[preset]}
              pressed={scene.lighting === preset}
              onClick={() => set({ lighting: preset })}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle hint="Light only, your background stays">Real-world lighting</SectionTitle>
        <div className="grid grid-cols-2 gap-1.5">
          {ENVIRONMENT_IDS.map((id) => (
            <LightingCard
              key={id}
              label={ENVIRONMENTS[id].label}
              tones={LIGHTING_TONES[id]}
              pressed={scene.lighting === id}
              onClick={() => set({ lighting: id })}
            />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Background</SectionTitle>
        <div role="group" aria-label="Background presets" className="flex flex-wrap gap-2.5">
          {BACKGROUND_PRESETS.map((preset) => {
            const active = sameBackground(scene.background, preset.background);
            return (
              <button
                key={preset.name}
                type="button"
                aria-label={preset.name}
                aria-pressed={active}
                title={preset.name}
                onClick={() => set({ background: preset.background })}
                className={`grid size-10 place-items-center rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] transition-transform hover:scale-105 ${focusRing} ${active ? 'ring-2 ring-neutral-900 ring-offset-2' : ''}`}
                style={{ background: backgroundPaint(preset.background) }}
              >
                {active && (
                  <CheckIcon
                    width={14}
                    height={14}
                    className={preset.name === 'Charcoal' ? 'text-white' : 'text-neutral-900'}
                  />
                )}
              </button>
            );
          })}
          <label
            title="Custom background"
            className={`relative grid size-10 cursor-pointer place-items-center rounded-full transition-transform focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-neutral-900 hover:scale-105 ${isPreset ? '' : 'ring-2 ring-neutral-900 ring-offset-2'}`}
            style={{
              background: isPreset
                ? 'conic-gradient(from 90deg, #f43f5e, #f59e0b, #84cc16, #06b6d4, #6366f1, #d946ef, #f43f5e)'
                : customColor,
            }}
          >
            <span className="sr-only">Custom background</span>
            <input
              type="color"
              value={customColor}
              onChange={(e) => set({ background: { type: 'solid', color: e.target.value } })}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>
        </div>
      </section>

      <section>
        <SectionTitle>Ground</SectionTitle>
        <div className="rounded-2xl bg-neutral-900/[0.03] p-1">
          <Switch
            label="Floor"
            description="A soft ground under the product"
            checked={scene.floor}
            onChange={(floor) => set({ floor })}
          />
          <Switch
            label="Shadows"
            description="Follow the light direction"
            checked={scene.shadows}
            onChange={(shadows) => set({ shadows })}
          />
        </div>
      </section>
    </div>
  );
}
