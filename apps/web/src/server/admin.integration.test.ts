import { PrismaPg } from '@prisma/adapter-pg';
import { afterAll, describe, expect, it } from 'vitest';

import { PrismaClient } from '@/generated/prisma/client';

import { adminStats, getWorkspaceDetail, listWorkspaces, WORKSPACES_PAGE_SIZE } from './admin';

// Needs a migrated Postgres via DATABASE_URL; skipped otherwise.
const url = process.env.DATABASE_URL;
const prisma = url ? new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) }) : null;

afterAll(async () => {
  await prisma?.$disconnect();
});

describe.skipIf(!prisma)('admin queries', () => {
  const db = prisma as PrismaClient;

  it('pages and searches workspaces, counts totals, and shows one workspace', async () => {
    const tag = `adm${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
    const owner = await db.user.create({ data: { email: `${tag}@example.com`, name: 'Ada' } });
    const ids: string[] = [];
    for (let i = 0; i < WORKSPACES_PAGE_SIZE + 2; i++) {
      const w = await db.workspace.create({ data: { name: `${tag} shop ${i}` } });
      ids.push(w.id);
    }
    const first = ids[0] ?? '';
    await db.membership.create({ data: { workspaceId: first, userId: owner.id } });
    await db.workspace.update({
      where: { id: first },
      data: { plan: 'PRO', planSetById: owner.id, planSetAt: new Date() },
    });

    const page1 = await listWorkspaces(db, { q: tag });
    expect(page1.total).toBe(WORKSPACES_PAGE_SIZE + 2);
    expect(page1.items).toHaveLength(WORKSPACES_PAGE_SIZE);
    expect(page1.pages).toBe(2);
    expect((await listWorkspaces(db, { q: tag, page: 2 })).items).toHaveLength(2);
    // Owner email search.
    expect((await listWorkspaces(db, { q: `${tag}@example` })).items.map((w) => w.id)).toEqual([
      first,
    ]);

    const stats = await adminStats(db);
    expect(stats.workspaces).toBeGreaterThanOrEqual(WORKSPACES_PAGE_SIZE + 2);
    expect(stats.byPlan.PRO).toBeGreaterThanOrEqual(1);

    const detail = await getWorkspaceDetail(db, first);
    expect(detail?.planSetBy).toBe(owner.email);
    expect(detail?.workspace.memberships[0]?.user.email).toBe(owner.email);
    expect(await getWorkspaceDetail(db, 'missing')).toBeNull();

    await db.workspace.deleteMany({ where: { id: { in: ids } } });
    await db.user.delete({ where: { id: owner.id } });
  });
});
