import { describe, expect, it } from 'vitest';

import { LIGHTING_PRESETS } from '../scene';
import { LIGHTING_RIGS } from './lighting-presets';

describe('LIGHTING_RIGS', () => {
  it('defines a rig for every preset', () => {
    expect(Object.keys(LIGHTING_RIGS).sort()).toEqual([...LIGHTING_PRESETS].sort());
  });

  it.each(LIGHTING_PRESETS)(
    '%s has a key light above the horizon (so shadows fall down)',
    (preset) => {
      expect(LIGHTING_RIGS[preset].key.direction[1]).toBeGreaterThan(0);
      expect(LIGHTING_RIGS[preset].key.intensity).toBeGreaterThan(0);
    },
  );

  it.each(LIGHTING_PRESETS)('%s has at least one environment panel', (preset) => {
    expect(LIGHTING_RIGS[preset].panels.length).toBeGreaterThan(0);
  });
});
