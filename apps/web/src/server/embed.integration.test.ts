import { PrismaPg } from '@prisma/adapter-pg';
import { loungeChairConfig } from '@twirl/config-schema/samples';
import { afterAll, describe, expect, it } from 'vitest';

import { PrismaClient } from '@/generated/prisma/client';

import { getPublishedProduct } from './embed';
import { createProduct } from './products';
import { createQuote } from './quotes';
import { createShare } from './shares';
import { publishDraft, unpublish } from './versions';

// Needs a migrated Postgres via DATABASE_URL; skipped otherwise.
const url = process.env.DATABASE_URL;
const prisma = url ? new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) }) : null;

afterAll(async () => {
  await prisma?.$disconnect();
});

describe.skipIf(!prisma)('getPublishedProduct', () => {
  const db = prisma as PrismaClient;

  it('serves only published products, with the plan’s watermark', async () => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const user = await db.user.create({ data: { email: `e-${unique}@example.com` } });
    const workspace = await db.workspace.create({
      data: { name: 'Embed', memberships: { create: { userId: user.id } } },
    });
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
    const { publicId } = await db.product.findUniqueOrThrow({
      where: { id: created.productId },
      select: { publicId: true },
    });

    expect(await getPublishedProduct(db, publicId)).toBeNull();
    await publishDraft(db, workspace.id, user.id, created.productId, loungeChairConfig);
    const live = await getPublishedProduct(db, publicId);
    expect(live).toMatchObject({ publicId, modelKey: asset.key, watermark: true });
    expect(live?.config.product.name).toBe('Halo Lounge Chair');
    expect(live?.locked).toBe(false);

    // After the free trial, shoppers get a still image only: no quotes, no new share links.
    await db.workspace.update({
      where: { id: workspace.id },
      data: { trialEndsAt: new Date(Date.now() - 1000) },
    });
    const ended = await getPublishedProduct(db, publicId);
    expect(ended?.locked).toBe(true);
    const selections = { fabric: 'oat' };
    expect(
      await createShare(db, { publicId, versionId: ended?.versionId, selections }),
    ).toMatchObject({ ok: false });
    expect(
      await createQuote(db, {
        publicId,
        versionId: ended?.versionId,
        selections,
        name: 'Maya',
        email: 'maya@example.com',
      }),
    ).toMatchObject({ ok: false });

    // Upgrading switches it back on.
    await db.workspace.update({ where: { id: workspace.id }, data: { plan: 'STARTER' } });
    expect(await getPublishedProduct(db, publicId)).toMatchObject({
      watermark: false,
      locked: false,
    });
    // The same requests that were refused above now go through.
    expect(
      await createShare(db, { publicId, versionId: live?.versionId, selections: {} }),
    ).toMatchObject({
      ok: true,
    });
    expect(
      await createQuote(db, {
        publicId,
        versionId: live?.versionId,
        selections: { fabric: 'oat' },
        name: 'Maya',
        email: 'maya@example.com',
      }),
    ).toMatchObject({ ok: true });

    await unpublish(db, workspace.id, created.productId);
    expect(await getPublishedProduct(db, publicId)).toBeNull();
    expect(await getPublishedProduct(db, "'; drop table--")).toBeNull();

    await db.workspace.delete({ where: { id: workspace.id } });
    await db.user.delete({ where: { id: user.id } });
  });
});
