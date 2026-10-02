import { useState } from 'react';

import {
  ENVIRONMENT_IDS,
  ENVIRONMENTS,
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

  const setBackground = (background: SceneBackground) => onChange({ ...scene, background });
  const backgroundFor = (type: SceneBackground['type']): SceneBackground =>
    type === 'solid' ? { type, color: colors.solid } : { type, from: colors.from, to: colors.to };

  return (
    <fieldset>
      <legend>Scene</legend>
      <label style={{ display: 'block' }}>
        Lighting{' '}
        <select
          value={scene.lighting}
          onChange={(e) =>
            onChange({ ...scene, lighting: e.target.value as SceneSettings['lighting'] })
          }
        >
          <optgroup label="Procedural (instant)">
            {LIGHTING_PRESETS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </optgroup>
          <optgroup label="HDRI lighting (~1.5 MB; lighting only)">
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
