import { PrismaPg } from '@prisma/adapter-pg';
import { loungeChairConfig } from '@twirl/config-schema/samples';
import { afterAll, describe, expect, it } from 'vitest';

import { PrismaClient } from '@/generated/prisma/client';

import { createProduct, getProductForEditor, newPublicId, saveDraft } from './products';

describe('newPublicId', () => {
  it('makes 12-character base62 ids', () => {
    const ids = new Set(Array.from({ length: 200 }, () => newPublicId()));
    expect(ids.size).toBe(200);
    for (const id of ids) expect(id).toMatch(/^[0-9a-zA-Z]{12}$/);
  });
});

// Needs a migrated Postgres via DATABASE_URL; skipped otherwise.
const url = process.env.DATABASE_URL;
const prisma = url ? new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) }) : null;

afterAll(async () => {
  await prisma?.$disconnect();
});

describe.skipIf(!prisma)('products', () => {
  const db = prisma as PrismaClient;
  const unique = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  async function workspaceWithModel(status: 'READY' | 'PENDING' = 'READY') {
    const user = await db.user.create({ data: { email: `p-${unique()}@example.com` } });
    const workspace = await db.workspace.create({
      data: { name: 'Products', memberships: { create: { userId: user.id } } },
    });
    const asset = await db.asset.create({
      data: {
        workspaceId: workspace.id,
        key: `test/${unique()}.glb`,
        filename: 'sofa.glb',
        mimeType: 'model/gltf-binary',
        size: 100,
        status,
      },
    });
    return { user, workspace, asset };
  }

  async function cleanup(workspaceId: string, userId: string) {
    await db.workspace.delete({ where: { id: workspaceId } });
    await db.user.delete({ where: { id: userId } });
  }

  it('creates a product with a draft, saves edits, and rejects invalid configs', async () => {
    const { user, workspace, asset } = await workspaceWithModel();
    const created = await createProduct(db, workspace.id, user.id, {
      assetId: asset.id,
      config: loungeChairConfig,
    });
    if (!created.ok) throw new Error(created.error);

    const found = await getProductForEditor(db, workspace.id, created.productId);
    expect(found?.product.name).toBe('Halo Lounge Chair');
    expect(found?.draft).toMatchObject({ number: 1, status: 'DRAFT', modelAssetId: asset.id });

    const renamed = { ...loungeChairConfig, product: { name: 'Halo Chair' } };
    expect((await saveDraft(db, workspace.id, created.productId, renamed)).ok).toBe(true);
    expect((await getProductForEditor(db, workspace.id, created.productId))?.product.name).toBe(
      'Halo Chair',
    );

    const invalid = { ...loungeChairConfig, parts: [] };
    const rejected = await saveDraft(db, workspace.id, created.productId, invalid);
    expect(rejected.ok).toBe(false);
    if (!rejected.ok) expect(rejected.issues?.length).toBeGreaterThan(0);

    // Published versions are never edited.
    await db.productVersion.updateMany({
      where: { productId: created.productId },
      data: { status: 'PUBLISHED' },
    });
    expect((await saveDraft(db, workspace.id, created.productId, renamed)).ok).toBe(false);
    await cleanup(workspace.id, user.id);
  });

  it('never reaches across workspaces or uses unready models', async () => {
    const a = await workspaceWithModel();
    const b = await workspaceWithModel();
    const pending = await workspaceWithModel('PENDING');

    // B can't use A's model…
    const stolen = await createProduct(db, b.workspace.id, b.user.id, {
      assetId: a.asset.id,
      config: loungeChairConfig,
    });
    expect(stolen.ok).toBe(false);
    // …or a model that isn't ready.
    const early = await createProduct(db, pending.workspace.id, pending.user.id, {
      assetId: pending.asset.id,
      config: loungeChairConfig,
    });
    expect(early.ok).toBe(false);

    const own = await createProduct(db, a.workspace.id, a.user.id, {
      assetId: a.asset.id,
      config: loungeChairConfig,
    });
    if (!own.ok) throw new Error(own.error);
    // B can neither open nor save A's product.
    expect(await getProductForEditor(db, b.workspace.id, own.productId)).toBeNull();
    expect((await saveDraft(db, b.workspace.id, own.productId, loungeChairConfig)).ok).toBe(false);

    for (const w of [a, b, pending]) await cleanup(w.workspace.id, w.user.id);
  });
});
