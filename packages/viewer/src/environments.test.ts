import { describe, expect, it } from 'vitest';

import {
  DEFAULT_ENVIRONMENT_SOURCES,
  ENVIRONMENT_IDS,
  environmentUrl,
  isEnvironmentId,
  pickEnvironmentResolution,
} from './environments';

describe('environmentUrl', () => {
  it('builds Poly Haven-style file names', () => {
    expect(environmentUrl('venice_sunset', '1k', DEFAULT_ENVIRONMENT_SOURCES)).toBe(
      '/hdri/1k/venice_sunset_1k.hdr',
    );
  });

  it('uses the 2k source when asked and available', () => {
    const sources = { '1k': '/hdri/1k/', '2k': 'https://cdn.example.com/hdri/2k' };
    expect(environmentUrl('autoshop_01', '2k', sources)).toBe(
      'https://cdn.example.com/hdri/2k/autoshop_01_2k.hdr',
    );
  });

  it('falls back to 1k when no 2k source is configured', () => {
    expect(environmentUrl('autoshop_01', '2k', DEFAULT_ENVIRONMENT_SOURCES)).toBe(
      '/hdri/1k/autoshop_01_1k.hdr',
    );
  });
});

describe('pickEnvironmentResolution', () => {
  it('uses 2k on large viewers when a 2k source exists', () => {
    expect(pickEnvironmentResolution({ physicalWidth: 2400, has2k: true })).toBe('2k');
  });

  it.each([
    { physicalWidth: 1170, has2k: true }, // phone
    { physicalWidth: 2400, has2k: false }, // no 2k hosting configured
  ])('uses 1k otherwise (%o)', (opts) => {
    expect(pickEnvironmentResolution(opts)).toBe('1k');
  });
});

describe('isEnvironmentId', () => {
  it('recognises catalogue ids only', () => {
    expect(ENVIRONMENT_IDS).toHaveLength(8);
    expect(isEnvironmentId('studio_small_08')).toBe(true);
    expect(isEnvironmentId('studio')).toBe(false);
    expect(isEnvironmentId('toString')).toBe(false);
  });
});
