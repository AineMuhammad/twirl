import { describe, expect, it } from 'vitest';

import { clientIp, visitorKey } from './client-key';

describe('visitor keys', () => {
  it('uses the real IP, else the first forwarded address', () => {
    expect(
      clientIp(new Headers({ 'x-real-ip': '203.0.113.7', 'x-forwarded-for': '1.1.1.1' })),
    ).toBe('203.0.113.7');
    expect(clientIp(new Headers({ 'x-forwarded-for': '198.51.100.2, 10.0.0.1' }))).toBe(
      '198.51.100.2',
    );
    expect(clientIp(new Headers())).toBe('unknown');
  });

  it('never exposes the IP and depends on the secret', () => {
    const headers = new Headers({ 'x-real-ip': '203.0.113.7' });
    const key = visitorKey(headers, 'secret-a');
    expect(key).not.toContain('203');
    expect(key).toHaveLength(22);
    expect(visitorKey(headers, 'secret-a')).toBe(key);
    expect(visitorKey(headers, 'secret-b')).not.toBe(key);
  });
});
