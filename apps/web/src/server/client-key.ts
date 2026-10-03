import { createHmac } from 'node:crypto';

/** The visitor's IP as Vercel reports it (falls back to the first forwarded address). */
export function clientIp(headers: Headers): string {
  const real = headers.get('x-real-ip')?.trim();
  if (real) return real;
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || 'unknown';
}

/**
 * A stable, non-reversible key for a visitor, so rate-limit counters never store raw IPs.
 * Keyed with a server secret so the hashes can't be matched against a list of IPs.
 */
export function visitorKey(headers: Headers, secret: string): string {
  return createHmac('sha256', secret).update(clientIp(headers)).digest('base64url').slice(0, 22);
}
