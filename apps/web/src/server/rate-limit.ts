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
    return { quote: make('quote'), share: make('share'), events: make('events') };
  })();
  return limiters[kind];
}

/**
 * Null when the request may proceed; otherwise a 429 response to return. Counts the request.
 */
export async function rateLimit(kind: LimitKind, request: Request): Promise<NextResponse | null> {
  const limiter = limiterFor(kind);
  if (!limiter) return null;
  try {
    const key = visitorKey(request.headers, serverEnv.AUTH_SECRET ?? 'twirl-rate-limit');
    const { success, reset } = await limiter.limit(key);
    if (success) return null;
    const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return NextResponse.json(
      { error: 'Too many requests. Please try again in a few minutes.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  } catch (error) {
    console.error('[rate-limit] check failed; allowing the request', kind, error);
    return null;
  }
}
