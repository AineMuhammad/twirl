import { CURRENT_SCHEMA_VERSION } from '@twirl/config-schema';
import { describe, expect, it } from 'vitest';

import { VIEWER_SUPPORTED_SCHEMA_VERSION } from './index';

describe('@twirl/viewer', () => {
  it('supports the current config schema version', () => {
    expect(VIEWER_SUPPORTED_SCHEMA_VERSION).toBe(CURRENT_SCHEMA_VERSION);
  });
});
