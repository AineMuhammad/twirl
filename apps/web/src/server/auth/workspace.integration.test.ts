import { PrismaPg } from '@prisma/adapter-pg';
import { afterAll, describe, expect, it } from 'vitest';

import { PrismaClient } from '@/generated/prisma/client';

import { ensureWorkspace } from './workspace';

// Needs a migrated Postgres via DATABASE_URL; skipped otherwise.
const url = process.env.DATABASE_URL;
const prisma = url ? new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) }) : null;

afterAll(async () => {
  await prisma?.$disconnect();
});

describe.skipIf(!prisma)('ensureWorkspace', () => {
  const db = prisma as PrismaClient;

  it('creates exactly one owned workspace, even for concurrent first requests', async () => {
    const user = await db.user.create({
      data: { email: `ws-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com` },
    });
    const results = await Promise.all(
      [0, 1, 2].map(() =>
        ensureWorkspace(db, { id: user.id, name: 'Ada Lovelace', email: user.email }),
      ),
    );
    expect(new Set(results.map((m) => m.workspaceId)).size).toBe(1);
    expect(results[0]?.role).toBe('OWNER');
    expect(results[0]?.workspace.name).toBe("Ada's workspace");
    expect(await db.membership.count({ where: { userId: user.id } })).toBe(1);

    await db.workspace.delete({ where: { id: results[0]?.workspaceId ?? '' } });
    await db.user.delete({ where: { id: user.id } });
  });
});
