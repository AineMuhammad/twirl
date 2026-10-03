import 'server-only';

import { redirect } from 'next/navigation';
import { cache } from 'react';

import { auth, authEnabled } from '@/auth';
import { serverEnv } from '@/env/server';
import { db } from '@/server/db';

import { isAdminEmail } from './admin';
import { ensureWorkspace } from './workspace';

export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  isAdmin: boolean;
}

/** The signed-in user, or null. Deduplicated per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (!authEnabled) return null;
  const session = await auth();
  const user = session?.user;
  if (!user?.id || !user.email) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    image: user.image ?? null,
    isAdmin: isAdminEmail(user.email, serverEnv.ADMIN_EMAILS),
  };
});

/** The signed-in user; otherwise redirects to sign-in and back to `returnTo` afterwards. */
export async function requireUser(returnTo = '/dashboard'): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/signin?callbackUrl=${encodeURIComponent(returnTo)}`);
  return user;
}

/** Thrown when a user reaches for a workspace they don't belong to. */
export class ForbiddenError extends Error {
  constructor() {
    super('You do not have access to this workspace.');
    this.name = 'ForbiddenError';
  }
}

/**
 * The signed-in user's workspace (v1: one per user, created on first sign-in). Every
 * workspace-scoped query starts here and filters by `workspace.id`; never trust a workspace id
 * from the client without `assertMember`.
 */
export async function requireWorkspace(returnTo = '/dashboard') {
  const user = await requireUser(returnTo);
  const membership = await workspaceFor(user);
  return { user, workspace: membership.workspace, role: membership.role };
}

// Layouts and pages both ask for the workspace; look it up once per request.
const workspaceFor = cache((user: CurrentUser) => ensureWorkspace(db(), user));

/** Throws `ForbiddenError` unless the user is a member of `workspaceId`. Returns their role. */
export async function assertMember(userId: string, workspaceId: string) {
  const membership = await db().membership.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { role: true },
  });
  if (!membership) throw new ForbiddenError();
  return membership.role;
}
