import 'server-only';

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

import { serverEnv } from '@/env/server';

import { visitorKey } from './client-key';

/**
 * Per-visitor limits on public endpoints (Upstash Redis, sliding windows). Off when Redis isn't
 * configured (local development). If Redis fails or is slow, requests are let through: shoppers
 * shouldn't be blocked by a limiter outage.
 */

const LIMITS = {
  quote: { requests: 5, window: '10 m' },
  share: { requests: 20, window: '10 m' },
  events: { requests: 60, window: '1 m' },
  model: { requests: 3, window: '1 h' },
} as const;

export type LimitKind = keyof typeof LIMITS;

const { KV_REST_API_URL: url, KV_REST_API_TOKEN: token } = serverEnv;
export const rateLimitEnabled = Boolean(url && token);

let limiters: Record<LimitKind, Ratelimit> | null = null;

function limiterFor(kind: LimitKind): Ratelimit | null {
  if (!url || !token) return null;
  limiters ??= (() => {
    const redis = new Redis({ url, token });
    const make = (k: LimitKind) =>
      new Ratelimit({
        redis,
        prefix: `twirl:rl:${k}`,
        limiter: Ratelimit.slidingWindow(LIMITS[k].requests, LIMITS[k].window),
        // Give up quickly and allow the request rather than slowing shoppers down.
        timeout: 1500,
        analytics: false,
      });
    return {
      quote: make('quote'),
      share: make('share'),
      events: make('events'),
      model: make('model'),
    };
  })();
  return limiters[kind];
}

/**
 * Whether a visitor (by request headers) is still under the limit. Counts the attempt. Fails open
 * when Redis is unavailable, and is always true when rate limiting is off.
 */
export async function underLimit(
  kind: LimitKind,
  headers: Headers,
): Promise<{ ok: true } | { ok: false; retryAfter: number }> {
  const limiter = limiterFor(kind);
  if (!limiter) return { ok: true };
  try {
    const key = visitorKey(headers, serverEnv.AUTH_SECRET ?? 'twirl-rate-limit');
    const { success, reset } = await limiter.limit(key);
    return success
      ? { ok: true }
      : { ok: false, retryAfter: Math.max(1, Math.ceil((reset - Date.now()) / 1000)) };
  } catch (error) {
    console.error('[rate-limit] check failed; allowing the request', kind, error);
    return { ok: true };
  }
}

/**
 * Null when the request may proceed; otherwise a 429 response to return. Counts the request.
 */
export async function rateLimit(kind: LimitKind, request: Request): Promise<NextResponse | null> {
  const result = await underLimit(kind, request.headers);
  if (result.ok) return null;
  return NextResponse.json(
    { error: 'Too many requests. Please try again in a few minutes.' },
    { status: 429, headers: { 'Retry-After': String(result.retryAfter) } },
  );
}
