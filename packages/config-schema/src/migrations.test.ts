import { describe, expect, it } from 'vitest';

import {
  ConfigVersionError,
  type Migration,
  migrateConfig,
  parseProductConfig,
} from './migrations';
import { loungeChairConfig } from './samples';

/** A pretend history: v1 had `title`, v2 renamed it to `name`, v3 added `tags`. */
const history: Record<number, Migration> = {
  1: ({ title, ...rest }) => ({ ...rest, name: title }),
  2: (c) => ({ ...c, tags: [] }),
};

describe('migrateConfig', () => {
  it('runs each migration in order up to the current version', () => {
    const { config, migratedFrom } = migrateConfig(
      { schemaVersion: 1, title: 'Chair' },
      history,
      3,
    );
    expect(config).toEqual({ schemaVersion: 3, name: 'Chair', tags: [] });
    expect(migratedFrom).toBe(1);
  });

  it('starts from the stored version', () => {
    expect(migrateConfig({ schemaVersion: 2, name: 'Chair' }, history, 3).config).toEqual({
      schemaVersion: 3,
      name: 'Chair',
      tags: [],
    });
  });

  it('returns current-version configs unchanged', () => {
    const input = { schemaVersion: 3, name: 'Chair', tags: [] };
    expect(migrateConfig(input, history, 3)).toEqual({ config: input, migratedFrom: null });
  });

  it('does not mutate its input', () => {
    const input = { schemaVersion: 1, title: 'Chair' };
    migrateConfig(input, history, 3);
    expect(input).toEqual({ schemaVersion: 1, title: 'Chair' });
  });

  it.each([
    ['newer versions', { schemaVersion: 9 }, /newer than supported/],
    ['missing versions', { name: 'x' }, /no valid schemaVersion/],
    ['non-integer versions', { schemaVersion: 1.5 }, /no valid schemaVersion/],
    ['non-objects', 'config', /must be an object/],
  ])('rejects %s', (_, input, message) => {
    expect(() => migrateConfig(input, history, 3)).toThrow(message);
  });

  it('reports a gap in the migration chain', () => {
    expect(() => migrateConfig({ schemaVersion: 1 }, { 2: (c) => c }, 3)).toThrow(
      ConfigVersionError,
    );
  });
});

describe('parseProductConfig', () => {
  it('parses a current config', () => {
    const result = parseProductConfig(loungeChairConfig);
    expect(result.success && result.data.product.name).toBe('Halo Lounge Chair');
    expect(result.success && result.migratedFrom).toBeNull();
  });

  it('returns version errors and validation errors without throwing', () => {
    const tooNew = parseProductConfig({ ...loungeChairConfig, schemaVersion: 2 });
    expect(!tooNew.success && tooNew.error).toBeInstanceOf(ConfigVersionError);
    const invalid = parseProductConfig({ ...loungeChairConfig, parts: 'nope' });
    expect(invalid.success).toBe(false);
  });
});
