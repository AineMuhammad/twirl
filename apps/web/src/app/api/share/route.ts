import { NextResponse } from 'next/server';

import { apiError } from '@/server/api';
import { databaseEnabled, db } from '@/server/db';
import { isSameOrigin } from '@/server/http';
import { rateLimit } from '@/server/rate-limit';
import { createShare } from '@/server/shares';

/**
 * Saves a shopper's design and returns its short id. Public (no sign-in), so it only accepts
 * requests from Twirl's own pages (the embed), is rate limited per visitor, and validates
 * everything.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return apiError(403, 'Cross-site request blocked.');
  if (!databaseEnabled) return apiError(503, 'Sharing is not available right now.');
  const limited = await rateLimit('share', request);
  if (limited) return limited;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return apiError(400, 'Nothing to share.');
  const result = await createShare(db(), {
    publicId: body.publicId,
    versionId: body.versionId,
    selections: body.selections,
  });
  if (!result.ok) return apiError(400, result.error);
  return NextResponse.json({ shortId: result.shortId }, { status: 201 });
}
