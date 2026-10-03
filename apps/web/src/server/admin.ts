import type { Prisma, PrismaClient } from '@/generated/prisma/client';

/** Admin-only queries across all workspaces. Callers must check `requireAdmin()` first. */

const DAY = 24 * 60 * 60 * 1000;

export async function adminStats(db: PrismaClient) {
  const since = new Date(Date.now() - 30 * DAY);
  const [workspaces, users, liveProducts, quotes30d, newModelRequests, byPlan] = await Promise.all([
    db.workspace.count(),
    db.user.count(),
    db.product.count({ where: { publishedVersionId: { not: null }, archivedAt: null } }),
    db.quoteRequest.count({ where: { createdAt: { gte: since } } }),
    db.modelRequest.count({ where: { status: 'NEW' } }),
    db.workspace.groupBy({ by: ['plan'], _count: { _all: true } }),
  ]);
  return {
    workspaces,
    users,
    liveProducts,
    quotes30d,
    newModelRequests,
    byPlan: Object.fromEntries(byPlan.map((p) => [p.plan, p._count._all])) as Partial<
      Record<'FREE' | 'STARTER' | 'PRO', number>
    >,
  };
}

export const WORKSPACES_PAGE_SIZE = 25;

/** Workspaces newest first, optionally matching a name or owner email, one page at a time. */
export async function listWorkspaces(db: PrismaClient, options: { q?: string; page?: number }) {
  const q = options.q?.trim().slice(0, 100) ?? '';
  const page = Math.max(1, Math.floor(options.page ?? 1));
  const where: Prisma.WorkspaceWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { memberships: { some: { user: { email: { contains: q, mode: 'insensitive' } } } } },
        ],
      }
    : {};
  const [total, items] = await Promise.all([
    db.workspace.count({ where }),
    db.workspace.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * WORKSPACES_PAGE_SIZE,
      take: WORKSPACES_PAGE_SIZE,
      include: {
        memberships: {
          where: { role: 'OWNER' },
          take: 1,
          include: { user: { select: { email: true } } },
        },
        _count: {
          select: { products: { where: { publishedVersionId: { not: null }, archivedAt: null } } },
        },
      },
    }),
  ]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / WORKSPACES_PAGE_SIZE)), q };
}

/** One workspace with its people, products and recent activity. */
export async function getWorkspaceDetail(db: PrismaClient, id: string) {
  const since = new Date(Date.now() - 30 * DAY);
  const workspace = await db.workspace.findUnique({
    where: { id },
    include: {
      memberships: { include: { user: { select: { email: true, name: true, createdAt: true } } } },
      products: {
        where: { archivedAt: null },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          publicId: true,
          updatedAt: true,
          publishedVersion: { select: { number: true } },
        },
      },
    },
  });
  if (!workspace) return null;
  const [quotes30d, assets, planSetBy] = await Promise.all([
    db.quoteRequest.count({ where: { workspaceId: id, createdAt: { gte: since } } }),
    db.asset.count({ where: { workspaceId: id, status: 'READY' } }),
    workspace.planSetById
      ? db.user.findUnique({ where: { id: workspace.planSetById }, select: { email: true } })
      : null,
  ]);
  return { workspace, quotes30d, assets, planSetBy: planSetBy?.email ?? null };
}
