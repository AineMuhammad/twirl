'use client';

import { ENVIRONMENT_IDS, ENVIRONMENTS, LIGHTING_PRESETS, type SceneSettings } from '@twirl/viewer';
import type { ReactNode } from 'react';

import { BACKGROUND_PRESETS, PROCEDURAL_LABELS, sameBackground } from '@/lib/scene-presets';

export interface ScenePanelProps {
  scene: SceneSettings;
  onChange: (scene: SceneSettings) => void;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">{title}</h3>
      {children}
    </section>
  );
}

function Choice({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`rounded-md border px-2.5 py-1.5 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 ${pressed ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 bg-white hover:border-neutral-500'}`}
    >
      {children}
    </button>
  );
}

function Switch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-md py-1 text-sm focus-visible:outline-2 focus-visible:outline-blue-600"
    >
      {label}
      <span
        aria-hidden
        className={`relative h-5 w-9 rounded-full transition-colors ${checked ? 'bg-neutral-900' : 'bg-neutral-300'}`}
      >
        <span
          className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4.5' : 'translate-x-0.5'}`}
        />
      </span>
    </button>
  );
}

export function ScenePanel({ scene, onChange }: ScenePanelProps) {
  const set = (patch: Partial<SceneSettings>) => onChange({ ...scene, ...patch });
  const customColor =
    scene.background.type === 'solid' ? scene.background.color : scene.background.to;

  return (
    <div className="space-y-6 p-4">
      <Section title="Studio lighting">
        <div className="grid grid-cols-2 gap-1.5">
          {LIGHTING_PRESETS.map((preset) => (
            <Choice
              key={preset}
              pressed={scene.lighting === preset}
              onClick={() => set({ lighting: preset })}
            >
              {PROCEDURAL_LABELS[preset]}
            </Choice>
          ))}
        </div>
      </Section>

      <Section title="Real-world lighting">
        <p className="text-xs text-neutral-500">
          Lighting captured in real places. Only the light changes; the background stays yours.
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {ENVIRONMENT_IDS.map((id) => (
            <Choice key={id} pressed={scene.lighting === id} onClick={() => set({ lighting: id })}>
              {ENVIRONMENTS[id].label}
            </Choice>
          ))}
        </div>
      </Section>

      <Section title="Background">
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Background presets"
        >
          {BACKGROUND_PRESETS.map((preset) => {
            const bg = preset.background;
            return (
              <button
                key={preset.name}
                type="button"
                aria-label={preset.name}
                aria-pressed={sameBackground(scene.background, bg)}
                title={preset.name}
                onClick={() => set({ background: bg })}
                className={`size-8 rounded-full border border-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${sameBackground(scene.background, bg) ? 'ring-2 ring-blue-600 ring-offset-2' : ''}`}
                style={{
                  background:
                    bg.type === 'solid' ? bg.color : `linear-gradient(${bg.from}, ${bg.to})`,
                }}
              />
            );
          })}
          <label className="ml-1 flex items-center gap-2 text-sm">
            <input
              type="color"
              value={customColor}
              onChange={(e) => set({ background: { type: 'solid', color: e.target.value } })}
              className="h-8 w-10 cursor-pointer rounded border border-neutral-300 bg-white p-0.5"
            />
            Custom
          </label>
        </div>
      </Section>

      <Section title="Ground">
        <Switch label="Floor" checked={scene.floor} onChange={(floor) => set({ floor })} />
        <Switch label="Shadows" checked={scene.shadows} onChange={(shadows) => set({ shadows })} />
      </Section>
    </div>
  );
}
