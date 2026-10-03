import { PrismaPg } from '@prisma/adapter-pg';
import { loungeChairConfig } from '@twirl/config-schema/samples';
import { afterAll, describe, expect, it } from 'vitest';

import { PrismaClient } from '@/generated/prisma/client';

import { createProduct } from './products';
import { publishDraft } from './versions';
import { deleteWorkspace, renameWorkspace } from './workspace-settings';

// Needs a migrated Postgres via DATABASE_URL; skipped otherwise.
const url = process.env.DATABASE_URL;
const prisma = url ? new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) }) : null;

afterAll(async () => {
  await prisma?.$disconnect();
});

describe.skipIf(!prisma)('workspace settings', () => {
  const db = prisma as PrismaClient;

  it('renames, and deletes everything including stored files', async () => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const user = await db.user.create({ data: { email: `del-${unique}@example.com` } });
    const workspace = await db.workspace.create({
      data: { name: 'Old name', memberships: { create: { userId: user.id } } },
    });
    expect(await renameWorkspace(db, workspace.id, '  New name  ')).toBe(true);
    expect((await db.workspace.findUniqueOrThrow({ where: { id: workspace.id } })).name).toBe(
      'New name',
    );
    expect(await renameWorkspace(db, workspace.id, '   ')).toBe(false);

    const asset = await db.asset.create({
      data: {
        workspaceId: workspace.id,
        key: `test/${unique}.glb`,
        filename: 'sofa.glb',
        mimeType: 'model/gltf-binary',
        size: 1,
        status: 'READY',
      },
    });
    const created = await createProduct(db, workspace.id, user.id, {
      assetId: asset.id,
      config: loungeChairConfig,
    });
    if (!created.ok) throw new Error(created.error);
    await publishDraft(db, workspace.id, user.id, created.productId, loungeChairConfig);

    const deleted: string[] = [];
    await deleteWorkspace(db, workspace.id, async (key) => {
      deleted.push(key);
    });
    expect(deleted).toEqual([asset.key]);
    expect(await db.workspace.findUnique({ where: { id: workspace.id } })).toBeNull();
    expect(await db.product.count({ where: { id: created.productId } })).toBe(0);
    expect(await db.asset.count({ where: { id: asset.id } })).toBe(0);
    // The person's account remains; they get a fresh workspace next time they sign in.
    expect(await db.user.findUnique({ where: { id: user.id } })).not.toBeNull();
    await db.user.delete({ where: { id: user.id } });
  });
});
