import { NextResponse } from 'next/server';

import { databaseEnabled, db } from '@/server/db';
import { recordEvents } from '@/server/events';
import { isSameOrigin } from '@/server/http';

/** Batched anonymous events from the configurator (sent with sendBeacon as text/plain). */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return new NextResponse(null, { status: 403 });
  if (!databaseEnabled) return new NextResponse(null, { status: 204 });
  const text = await request.text();
  // A batch is small; anything bigger isn't ours.
  if (text.length > 16_000) return new NextResponse(null, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const ok = await recordEvents(db(), body);
  return new NextResponse(null, { status: ok ? 204 : 400 });
}
