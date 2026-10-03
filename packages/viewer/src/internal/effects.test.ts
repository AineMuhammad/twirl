import { describe, expect, it } from 'vitest';

import { effectsEnabled } from './effects';

describe('effectsEnabled', () => {
  it('honours explicit on/off', () => {
    expect(effectsEnabled('on', true, 0)).toBe(true);
    expect(effectsEnabled('off', false, 1)).toBe(false);
  });

  it('auto: on for desktops at good quality, off for phones or when struggling', () => {
    expect(effectsEnabled('auto', false, 1)).toBe(true);
    expect(effectsEnabled('auto', true, 1)).toBe(false);
    expect(effectsEnabled('auto', false, 0.3)).toBe(false);
  });
});
