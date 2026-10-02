import { useState } from 'react';

import {
  ENVIRONMENT_IDS,
  ENVIRONMENTS,
  isEnvironmentId,
  LIGHTING_PRESETS,
  type SceneBackground,
  type SceneSettings,
} from '../src';

export interface ScenePanelProps {
  scene: SceneSettings;
  onChange: (scene: SceneSettings) => void;
}

/** Dev-only scene controls. Not the product UI. */
export function ScenePanel({ scene, onChange }: ScenePanelProps) {
  const bg = scene.background;
  // Remember colors while switching background types.
  const [colors, setColors] = useState({ solid: '#ffffff', from: '#ffffff', to: '#e9e9ec' });
  const [blur, setBlur] = useState(0.4);
  const environmentLighting = isEnvironmentId(scene.lighting);

  const setBackground = (background: SceneBackground) => onChange({ ...scene, background });
  const backgroundFor = (type: SceneBackground['type']): SceneBackground =>
    type === 'solid'
      ? { type, color: colors.solid }
      : type === 'gradient'
        ? { type, from: colors.from, to: colors.to }
        : { type, blur };

  return (
    <fieldset>
      <legend>Scene</legend>
      <label style={{ display: 'block' }}>
        Lighting{' '}
        <select
          value={scene.lighting}
          onChange={(e) => {
            const lighting = e.target.value as SceneSettings['lighting'];
            // An environment background needs an environment to show.
            const background =
              bg.type === 'environment' && !isEnvironmentId(lighting)
                ? backgroundFor('gradient')
                : bg;
            onChange({ ...scene, lighting, background });
          }}
        >
          <optgroup label="Procedural (instant)">
            {LIGHTING_PRESETS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </optgroup>
          <optgroup label="HDRI environments (~1.5 MB)">
            {ENVIRONMENT_IDS.map((id) => (
              <option key={id} value={id}>
                {ENVIRONMENTS[id].label}
              </option>
            ))}
          </optgroup>
        </select>
      </label>

      <label style={{ display: 'block' }}>
        Background{' '}
        <select
          value={bg.type}
          onChange={(e) => setBackground(backgroundFor(e.target.value as SceneBackground['type']))}
        >
          <option value="solid">Solid</option>
          <option value="gradient">Gradient</option>
          <option value="environment" disabled={!environmentLighting}>
            Environment{environmentLighting ? '' : ' (pick an HDRI)'}
          </option>
        </select>
      </label>

      {bg.type === 'solid' && (
        <input
          type="color"
          aria-label="Background color"
          value={bg.color}
          onChange={(e) => {
            setColors({ ...colors, solid: e.target.value });
            setBackground({ type: 'solid', color: e.target.value });
          }}
        />
      )}
      {bg.type === 'gradient' && (
        <div>
          {(['from', 'to'] as const).map((key) => (
            <input
              key={key}
              type="color"
              aria-label={key === 'from' ? 'Gradient top color' : 'Gradient bottom color'}
              value={bg[key]}
              onChange={(e) => {
                setColors({ ...colors, [key]: e.target.value });
                setBackground({ ...bg, [key]: e.target.value });
              }}
            />
          ))}
        </div>
      )}
      {bg.type === 'environment' && (
        <label style={{ display: 'block' }}>
          Blur {bg.blur.toFixed(2)}
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={bg.blur}
            onChange={(e) => {
              setBlur(Number(e.target.value));
              setBackground({ type: 'environment', blur: Number(e.target.value) });
            }}
            style={{ display: 'block', width: '100%' }}
          />
        </label>
      )}

      <label style={{ display: 'block' }}>
        <input
          type="checkbox"
          checked={scene.floor}
          onChange={(e) => onChange({ ...scene, floor: e.target.checked })}
        />{' '}
        Floor
      </label>
      <label style={{ display: 'block' }}>
        <input
          type="checkbox"
          checked={scene.shadows}
          onChange={(e) => onChange({ ...scene, shadows: e.target.checked })}
        />{' '}
        Shadows
      </label>
    </fieldset>
  );
}
