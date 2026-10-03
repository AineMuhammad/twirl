import { describe, expect, it } from 'vitest';

import { CURRENT_SCHEMA_VERSION, isSupportedSchemaVersion } from './version';

describe('isSupportedSchemaVersion', () => {
  it('accepts every version from 1 up to the current one', () => {
    for (let v = 1; v <= CURRENT_SCHEMA_VERSION; v++) {
      expect(isSupportedSchemaVersion(v)).toBe(true);
    }
  });

  it.each([0, -1, CURRENT_SCHEMA_VERSION + 1, 1.5, '1', null, undefined])('rejects %p', (value) => {
    expect(isSupportedSchemaVersion(value)).toBe(false);
  });
});
