import { PrismaPg } from '@prisma/adapter-pg';
import { loungeChairConfig } from '@twirl/config-schema/samples';
import { afterAll, describe, expect, it } from 'vitest';

import { PrismaClient } from '@/generated/prisma/client';

import { getPublishedProduct } from './embed';
import { createProduct } from './products';
import { createShare, getShare } from './shares';
import { publishDraft } from './versions';

// Needs a migrated Postgres via DATABASE_URL; skipped otherwise.
const url = process.env.DATABASE_URL;
const prisma = url ? new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) }) : null;

afterAll(async () => {
  await prisma?.$disconnect();
});

describe.skipIf(!prisma)('share links', () => {
  const db = prisma as PrismaClient;

  it('pins the version, stores rule-corrected choices, and rejects bad input', async () => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const user = await db.user.create({ data: { email: `s-${unique}@example.com` } });
    const workspace = await db.workspace.create({
      data: { name: 'Share', memberships: { create: { userId: user.id } } },
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

    // Not shareable before publishing.
    const early = await createShare(db, { publicId, versionId: 'x', selections: {} });
    expect(early.ok).toBe(false);

    await publishDraft(db, workspace.id, user.id, created.productId, loungeChairConfig);
    const live = await getPublishedProduct(db, publicId);
    if (!live) throw new Error('not live');

    // 140 cm needs the brass frame: the saved design is the corrected one.
    const shared = await createShare(db, {
      publicId,
      versionId: live.versionId,
      selections: { diameter: 140, fabric: 'sage', unknown: 'ignored' },
    });
    if (!shared.ok) throw new Error(shared.error);
    expect(shared.shortId).toMatch(/^[0-9A-Za-z]{10}$/);
    const opened = await getShare(db, shared.shortId);
    expect(opened?.selections).toMatchObject({
      diameter: 140,
      fabric: 'sage',
      'frame-finish': 'brass',
    });
    expect(opened?.selections).not.toHaveProperty('unknown');

    // Republishing doesn't change what the link shows.
    const renamed = { ...loungeChairConfig, product: { name: 'Halo v2' } };
    await publishDraft(db, workspace.id, user.id, created.productId, renamed);
    expect((await getShare(db, shared.shortId))?.config.product.name).toBe('Halo Lounge Chair');

    // Bad input.
    for (const input of [
      { publicId: 'bad id!', versionId: live.versionId, selections: {} },
      { publicId, versionId: live.versionId, selections: [] },
      { publicId, versionId: live.versionId, selections: { big: 'x'.repeat(9000) } },
      { publicId: 'abcdefghijkl', versionId: live.versionId, selections: {} },
    ]) {
      expect((await createShare(db, input)).ok).toBe(false);
    }

    // Archived products' links stop working.
    await db.product.update({ where: { id: created.productId }, data: { archivedAt: new Date() } });
    expect(await getShare(db, shared.shortId)).toBeNull();
    expect(await getShare(db, 'nope')).toBeNull();

    await db.workspace.delete({ where: { id: workspace.id } });
    await db.user.delete({ where: { id: user.id } });
  });
});
