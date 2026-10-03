import type { PrismaClient } from '@/generated/prisma/client';

/** "Ada's workspace" from a name, else from the email's local part. */
export function defaultWorkspaceName(user: { name?: string | null; email: string }) {
  const first = user.name?.trim().split(/\s+/)[0];
  const owner = first || user.email.split('@')[0] || 'My';
  return `${owner.slice(0, 60)}'s workspace`;
}

/**
 * The user's workspace, created with them as owner if they have none (first sign-in). Safe to
 * call repeatedly: it runs in a transaction that re-checks for an existing membership.
 */
export async function ensureWorkspace(
  db: PrismaClient,
  user: { id: string; name?: string | null; email: string },
) {
  return db.$transaction(async (tx) => {
    // Serialise concurrent first requests for the same user.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${user.id}))`;
    const existing = await tx.membership.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      include: { workspace: true },
    });
    if (existing) return existing;
    const workspace = await tx.workspace.create({
      data: {
        name: defaultWorkspaceName(user),
        memberships: { create: { userId: user.id, role: 'OWNER' } },
      },
      include: { memberships: true },
    });
    const [membership] = workspace.memberships;
    if (!membership) throw new Error('Workspace created without an owner.');
    return { ...membership, workspace };
  });
}
