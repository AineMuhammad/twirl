import { PrismaPg } from '@prisma/adapter-pg';
import { afterAll, describe, expect, it } from 'vitest';

import { PrismaClient } from '@/generated/prisma/client';

import { assertCanPublish, checkPublish, PlanLimitError } from './plans';

// Needs a migrated Postgres via DATABASE_URL; skipped otherwise.
const url = process.env.DATABASE_URL;
const prisma = url ? new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) }) : null;

afterAll(async () => {
  await prisma?.$disconnect();
});

describe.skipIf(!prisma)('publish limits', () => {
  const db = prisma as PrismaClient;
  const id = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  /** A workspace with `live` published products and one unpublished draft product. */
  async function workspaceWith(live: number, plan: 'FREE' | 'STARTER' = 'FREE') {
    const workspace = await db.workspace.create({ data: { name: 'Limits', plan } });
    const make = async (publish: boolean) => {
      const product = await db.product.create({
        data: { workspaceId: workspace.id, publicId: `p-${id()}`, name: 'Item' },
      });
      const version = await db.productVersion.create({
        data: { productId: product.id, number: 1, config: {}, schemaVersion: 1 },
      });
      if (publish) {
        await db.product.update({
          where: { id: product.id },
          data: { publishedVersionId: version.id },
        });
      }
      return product.id;
    };
    const liveIds = [];
    for (let i = 0; i < live; i++) liveIds.push(await make(true));
    return { workspace, liveIds, draftId: await make(false) };
  }

  it('blocks a new product at the limit but lets a live one re-publish', async () => {
    const { workspace, liveIds, draftId } = await workspaceWith(1);
    expect(await checkPublish(db, workspace.id, draftId)).toMatchObject({
      allowed: false,
      used: 1,
      limit: 1,
    });
    await expect(
      db.$transaction((tx) => assertCanPublish(tx, workspace.id, draftId)),
    ).rejects.toBeInstanceOf(PlanLimitError);
    await expect(
      db.$transaction((tx) => assertCanPublish(tx, workspace.id, liveIds[0] ?? '')),
    ).resolves.toMatchObject({ allowed: true });

    // Upgrading lifts the limit.
    await db.workspace.update({ where: { id: workspace.id }, data: { plan: 'STARTER' } });
    expect((await checkPublish(db, workspace.id, draftId)).allowed).toBe(true);
    await db.workspace.delete({ where: { id: workspace.id } });
  });

  it("doesn't count archived products", async () => {
    const { workspace, liveIds, draftId } = await workspaceWith(1);
    await db.product.update({ where: { id: liveIds[0] ?? '' }, data: { archivedAt: new Date() } });
    expect((await checkPublish(db, workspace.id, draftId)).allowed).toBe(true);
    await db.workspace.delete({ where: { id: workspace.id } });
  });
});
