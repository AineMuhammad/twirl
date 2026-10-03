import { describe, expect, it } from 'vitest';

import { parseEnv } from './parse';
import { clientSchema, serverSchema } from './schema';

describe('parseEnv', () => {
  it('treats blank values as unset', () => {
    expect(parseEnv(serverSchema, { DATABASE_URL: '' }, 'server').DATABASE_URL).toBeUndefined();
    expect(parseEnv(clientSchema, { NEXT_PUBLIC_APP_URL: '' }, 'client')).toEqual({});
  });

  it('lists invalid variables by name without their values', () => {
    expect(() => parseEnv(serverSchema, { DATABASE_URL: 'mysql://secret' }, 'server')).toThrow(
      /DATABASE_URL[^]*See \.env\.example/,
    );
    expect(() => parseEnv(serverSchema, { DATABASE_URL: 'mysql://secret' }, 'server')).not.toThrow(
      /secret/,
    );
  });
});
