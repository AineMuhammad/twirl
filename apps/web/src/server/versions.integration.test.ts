import { PrismaPg } from '@prisma/adapter-pg';
import { loungeChairConfig } from '@twirl/config-schema/samples';
import { afterAll, describe, expect, it } from 'vitest';

import { PrismaClient } from '@/generated/prisma/client';

import { createProduct, getProductForEditor } from './products';
import { copyToDraft, listVersions, makeLive, publishDraft, unpublish } from './versions';

// Needs a migrated Postgres via DATABASE_URL; skipped otherwise.
const url = process.env.DATABASE_URL;
const prisma = url ? new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) }) : null;

afterAll(async () => {
  await prisma?.$disconnect();
});

describe.skipIf(!prisma)('publishing', () => {
  const db = prisma as PrismaClient;
  const unique = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  async function setup(products = 1) {
    const user = await db.user.create({ data: { email: `v-${unique()}@example.com` } });
    const workspace = await db.workspace.create({
      data: { name: 'Versions', memberships: { create: { userId: user.id } } },
    });
    const asset = await db.asset.create({
      data: {
        workspaceId: workspace.id,
        key: `test/${unique()}.glb`,
        filename: 'sofa.glb',
        mimeType: 'model/gltf-binary',
        size: 100,
        status: 'READY',
      },
    });
    const ids: string[] = [];
    for (let i = 0; i < products; i++) {
      const created = await createProduct(db, workspace.id, user.id, {
        assetId: asset.id,
        config: loungeChairConfig,
      });
      if (!created.ok) throw new Error(created.error);
      ids.push(created.productId);
    }
    const cleanup = async () => {
      await db.workspace.delete({ where: { id: workspace.id } });
      await db.user.delete({ where: { id: user.id } });
    };
    return { user, workspace, ids, cleanup };
  }

  it('freezes the draft, goes live, and keeps editing on a new draft', async () => {
    const { user, workspace, ids, cleanup } = await setup();
    const id = ids[0] ?? '';
    const renamed = { ...loungeChairConfig, product: { name: 'Halo v1' } };

    expect(await publishDraft(db, workspace.id, user.id, id, renamed)).toEqual({
      ok: true,
      number: 1,
    });
    const editor = await getProductForEditor(db, workspace.id, id);
    expect(editor?.draft.number).toBe(2);
    expect(editor?.product.name).toBe('Halo v1');

    const history = await listVersions(db, workspace.id, id);
    expect(history.map((v) => [v.number, v.live])).toEqual([[1, true]]);

    // Publishing again creates v2 live and a v3 draft; v1 stays in history.
    expect((await publishDraft(db, workspace.id, user.id, id, loungeChairConfig)).ok).toBe(true);
    const after = await listVersions(db, workspace.id, id);
    expect(after.map((v) => [v.number, v.live])).toEqual([
      [2, true],
      [1, false],
    ]);

    // Roll back to v1, then copy v1 into the draft.
    const v1 = after.find((v) => v.number === 1);
    expect((await makeLive(db, workspace.id, id, v1?.id ?? '')).ok).toBe(true);
    expect((await listVersions(db, workspace.id, id)).find((v) => v.live)?.number).toBe(1);
    const copied = await copyToDraft(db, workspace.id, id, v1?.id ?? '');
    expect(copied.ok).toBe(true);
    const draft = await getProductForEditor(db, workspace.id, id);
    expect((draft?.draft.config as { product: { name: string } }).product.name).toBe('Halo v1');

    expect((await unpublish(db, workspace.id, id)).ok).toBe(true);
    expect((await listVersions(db, workspace.id, id)).some((v) => v.live)).toBe(false);
    await cleanup();
  });

  it('enforces the plan limit and rejects invalid configs', async () => {
    const { user, workspace, ids, cleanup } = await setup(2);
    const [first = '', second = ''] = ids;
    expect((await publishDraft(db, workspace.id, user.id, first, loungeChairConfig)).ok).toBe(true);
    // Free plan: one live product. Re-publishing the live one is fine; a second isn't.
    expect((await publishDraft(db, workspace.id, user.id, first, loungeChairConfig)).ok).toBe(true);
    const blocked = await publishDraft(db, workspace.id, user.id, second, loungeChairConfig);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.error).toMatch(/free trial includes 1 live product/);

    const invalid = await publishDraft(db, workspace.id, user.id, first, {
      ...loungeChairConfig,
      parts: [],
    });
    expect(invalid.ok).toBe(false);
    await cleanup();
  });

  it('never touches another workspace', async () => {
    const a = await setup();
    const b = await setup();
    const id = a.ids[0] ?? '';
    expect((await publishDraft(db, b.workspace.id, b.user.id, id, loungeChairConfig)).ok).toBe(
      false,
    );
    expect((await unpublish(db, b.workspace.id, id)).ok).toBe(false);
    expect(await listVersions(db, b.workspace.id, id)).toEqual([]);
    await a.cleanup();
    await b.cleanup();
  });
});
