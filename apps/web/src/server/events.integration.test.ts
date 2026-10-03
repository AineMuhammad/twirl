import { PrismaPg } from '@prisma/adapter-pg';
import { loungeChairConfig } from '@twirl/config-schema/samples';
import { afterAll, describe, expect, it } from 'vitest';

import { PrismaClient } from '@/generated/prisma/client';

import { getPublishedProduct } from './embed';
import { eventCounts, recordEvents } from './events';
import { createProduct } from './products';
import { publishDraft } from './versions';

// Needs a migrated Postgres via DATABASE_URL; skipped otherwise.
const url = process.env.DATABASE_URL;
const prisma = url ? new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) }) : null;

afterAll(async () => {
  await prisma?.$disconnect();
});

describe.skipIf(!prisma)('events', () => {
  const db = prisma as PrismaClient;

  it('records batches for live products and counts them per workspace', async () => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const user = await db.user.create({ data: { email: `ev-${unique}@example.com` } });
    const workspace = await db.workspace.create({
      data: { name: 'Events', memberships: { create: { userId: user.id } } },
    });
    const other = await db.workspace.create({ data: { name: 'Other' } });
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

    const visit = (sessionId: string, events: unknown[], versionId?: string) =>
      recordEvents(db, { publicId, sessionId, events, ...(versionId && { versionId }) });

    // Not live yet: dropped.
    expect(await visit('session-aaaa', [{ type: 'view' }])).toBe(false);

    await publishDraft(db, workspace.id, user.id, created.productId, loungeChairConfig);
    const live = await getPublishedProduct(db, publicId);
    expect(
      await visit(
        'session-aaaa',
        [{ type: 'view' }, { type: 'option_change', group: 'fabric' }, { type: 'share' }],
        live?.versionId,
      ),
    ).toBe(true);
    expect(
      await visit('session-bbbb', [{ type: 'view' }, { type: 'view' }, { type: 'quote_request' }]),
    ).toBe(true);
    expect(await visit('session-cccc', [{ type: 'nope' }])).toBe(false);

    const counts = (await eventCounts(db, workspace.id, [created.productId])).get(
      created.productId,
    );
    expect(counts).toMatchObject({
      view: 3,
      visitors: 2,
      option_change: 1,
      share: 1,
      quote_request: 1,
      image_download: 0,
    });
    // Another workspace sees nothing for this product.
    expect(
      (await eventCounts(db, other.id, [created.productId])).get(created.productId)?.view,
    ).toBe(0);

    await db.workspace.delete({ where: { id: workspace.id } });
    await db.workspace.delete({ where: { id: other.id } });
    await db.user.delete({ where: { id: user.id } });
  });
});
