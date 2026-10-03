import { PrismaPg } from '@prisma/adapter-pg';
import { loungeChairConfig } from '@twirl/config-schema/samples';
import { afterAll, describe, expect, it } from 'vitest';

import { PrismaClient } from '@/generated/prisma/client';

import { getPublishedProduct } from './embed';
import { createProduct } from './products';
import { createQuote, getQuote, listQuotes, setQuoteStatus, workspaceOwnerEmails } from './quotes';
import { publishDraft } from './versions';

// Needs a migrated Postgres via DATABASE_URL; skipped otherwise.
const url = process.env.DATABASE_URL;
const prisma = url ? new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) }) : null;

afterAll(async () => {
  await prisma?.$disconnect();
});

describe.skipIf(!prisma)('quote requests', () => {
  const db = prisma as PrismaClient;

  async function liveProduct() {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const user = await db.user.create({ data: { email: `owner-${unique}@example.com` } });
    const workspace = await db.workspace.create({
      data: { name: 'Quotes', memberships: { create: { userId: user.id } } },
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
    await publishDraft(db, workspace.id, user.id, created.productId, loungeChairConfig);
    const live = await getPublishedProduct(db, publicId);
    if (!live) throw new Error('not live');
    const cleanup = async () => {
      await db.workspace.delete({ where: { id: workspace.id } });
      await db.user.delete({ where: { id: user.id } });
    };
    return { user, workspace, publicId, versionId: live.versionId, cleanup };
  }

  it('prices on the server, describes the design, and files it in the right workspace', async () => {
    const p = await liveProduct();
    const result = await createQuote(db, {
      publicId: p.publicId,
      versionId: p.versionId,
      selections: { fabric: 'teal-velvet', 'pillow-navy': false },
      name: '  Ada Lovelace ',
      email: 'Ada@Example.com',
      message: 'Can you deliver in May?',
      price: 1, // ignored: the server prices the design itself
    });
    if (!result.ok || !result.quote) throw new Error('expected a quote');
    // 899 base + 49 diamond cushion + 60 teal velvet (navy cushion removed).
    expect(result.quote.price).toBe('$1,008.00');
    expect(result.quote.lines[0]).toEqual({ label: 'Seat fabric', value: 'Teal velvet' });
    expect(await workspaceOwnerEmails(db, p.workspace.id)).toEqual([p.user.email]);

    const stored = await getQuote(db, p.workspace.id, result.quote.id);
    expect(stored?.quote).toMatchObject({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      priceTotal: 100800,
      status: 'NEW',
    });
    expect(await listQuotes(db, p.workspace.id)).toHaveLength(1);

    expect(await setQuoteStatus(db, p.workspace.id, result.quote.id, 'ARCHIVED')).toBe(true);
    expect(await listQuotes(db, p.workspace.id)).toHaveLength(0);
    expect(await listQuotes(db, p.workspace.id, 'ARCHIVED')).toHaveLength(1);
    await p.cleanup();
  });

  it('drops honeypot submissions, explains bad input, and keeps workspaces apart', async () => {
    const p = await liveProduct();
    const other = await liveProduct();
    const base = { publicId: p.publicId, versionId: p.versionId, selections: {} };

    expect(
      await createQuote(db, { ...base, name: 'Bot', email: 'bot@example.com', website: 'x' }),
    ).toEqual({
      ok: true,
      quote: null,
    });
    expect(await listQuotes(db, p.workspace.id)).toHaveLength(0);

    expect(await createQuote(db, { ...base, name: '', email: 'a@b.co' })).toEqual({
      ok: false,
      error: 'Please enter your name.',
    });
    expect(await createQuote(db, { ...base, name: 'Ada', email: 'nope' })).toEqual({
      ok: false,
      error: 'Please enter a valid email address.',
    });
    expect(
      (await createQuote(db, { ...base, versionId: 'missing', name: 'Ada', email: 'a@b.co' })).ok,
    ).toBe(false);

    const real = await createQuote(db, { ...base, name: 'Ada', email: 'a@b.co' });
    if (!real.ok || !real.quote) throw new Error('expected a quote');
    expect(await getQuote(db, other.workspace.id, real.quote.id)).toBeNull();
    expect(await setQuoteStatus(db, other.workspace.id, real.quote.id, 'ARCHIVED')).toBe(false);

    await p.cleanup();
    await other.cleanup();
  });
});
