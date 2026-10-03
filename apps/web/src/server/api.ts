import 'server-only';

import { NextResponse } from 'next/server';

import { db } from '@/server/db';

import { getCurrentUser } from './auth/session';
import { isSameOrigin } from './http';
import { ensureWorkspace } from './auth/workspace';

/** A JSON error with a message that's safe to show users. */
export function apiError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * The signed-in user's workspace for an API route, or an error response (401/403) to return.
 * Route handlers must scope every query by the returned `workspace.id`.
 */
export async function apiWorkspace(request: Request) {
  if (!isSameOrigin(request)) return { error: apiError(403, 'Cross-site request blocked.') };
  const user = await getCurrentUser();
  if (!user) return { error: apiError(401, 'Please sign in again.') };
  const membership = await ensureWorkspace(db(), user);
  return { user, workspace: membership.workspace };
}
