import { describe, expect, it } from 'vitest';

import { isAdminEmail } from './admin';
import { safeReturnPath, signInErrorMessage } from './redirect';
import { defaultWorkspaceName } from './workspace';

describe('isAdminEmail', () => {
  it('matches case-insensitively in a comma-separated list', () => {
    expect(isAdminEmail('Ada@Example.com', 'bob@x.com, ada@example.com')).toBe(true);
    expect(isAdminEmail('eve@example.com', 'ada@example.com')).toBe(false);
    expect(isAdminEmail('ada@example.com', undefined)).toBe(false);
    expect(isAdminEmail(null, 'ada@example.com')).toBe(false);
    expect(isAdminEmail('', ',')).toBe(false);
  });
});

describe('safeReturnPath', () => {
  it('keeps same-site paths and rejects everything else', () => {
    expect(safeReturnPath('/dashboard/products?x=1')).toBe('/dashboard/products?x=1');
    for (const bad of ['https://evil.com', '//evil.com', '/\\evil.com', 'dashboard', 42, null]) {
      expect(safeReturnPath(bad)).toBe('/dashboard');
    }
  });
});

describe('signInErrorMessage', () => {
  it('explains known codes and falls back for unknown ones', () => {
    expect(signInErrorMessage(undefined)).toBeNull();
    expect(signInErrorMessage('Verification')).toMatch(/expired/);
    expect(signInErrorMessage('Whatever')).toMatch(/went wrong/);
  });
});

describe('defaultWorkspaceName', () => {
  it('uses the first name, else the email local part', () => {
    expect(defaultWorkspaceName({ name: 'Ada Lovelace', email: 'ada@x.com' })).toBe(
      "Ada's workspace",
    );
    expect(defaultWorkspaceName({ name: null, email: 'studio.rossi@x.com' })).toBe(
      "studio.rossi's workspace",
    );
  });
});
