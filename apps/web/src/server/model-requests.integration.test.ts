import { PrismaPg } from '@prisma/adapter-pg';
import { afterAll, describe, expect, it } from 'vitest';

import { PrismaClient } from '@/generated/prisma/client';

import {
  createModelRequest,
  listModelRequests,
  parseLinks,
  setModelRequestStatus,
} from './model-requests';

describe('parseLinks', () => {
  it('accepts up to 10 http(s) links, one per line or comma-separated', () => {
    expect(parseLinks(' https://a.example/chair \nhttp://b.example, https://c.example ')).toEqual([
      'https://a.example/chair',
      'http://b.example',
      'https://c.example',
    ]);
    expect(parseLinks(undefined)).toEqual([]);
    expect(parseLinks('not a link')).toBeNull();
    expect(parseLinks('javascript:alert(1)')).toBeNull();
    expect(
      parseLinks(Array.from({ length: 11 }, (_, i) => `https://x.example/${i}`).join('\n')),
    ).toBeNull();
  });
});

// Needs a migrated Postgres via DATABASE_URL; skipped otherwise.
const url = process.env.DATABASE_URL;
const prisma = url ? new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) }) : null;

afterAll(async () => {
  await prisma?.$disconnect();
});

describe.skipIf(!prisma)('model requests', () => {
  const db = prisma as PrismaClient;

  it('saves valid requests, drops bots and explains problems', async () => {
    const workspace = await db.workspace.create({ data: { name: 'Requests' } });
    const valid = {
      name: 'Ada',
      email: 'Ada@Example.com',
      description: 'A lounge chair, 120 cm wide, with a removable cushion.',
      links: 'https://example.com/chair',
    };
    const created = await createModelRequest(db, valid, workspace.id);
    if (!created.ok || !created.request) throw new Error('expected a request');
    const stored = await db.modelRequest.findUniqueOrThrow({ where: { id: created.request.id } });
    expect(stored).toMatchObject({
      email: 'ada@example.com',
      links: ['https://example.com/chair'],
      workspaceId: workspace.id,
      status: 'NEW',
    });

    expect(await createModelRequest(db, { ...valid, website: 'spam' }, null)).toEqual({
      ok: true,
      request: null,
    });
    expect(await createModelRequest(db, { ...valid, description: 'short' }, null)).toMatchObject({
      ok: false,
      error: expect.stringContaining('at least 10 characters'),
    });
    expect((await createModelRequest(db, { ...valid, links: 'nope' }, null)).ok).toBe(false);

    expect(await setModelRequestStatus(db, created.request.id, 'IN_PROGRESS')).toBe(true);
    expect(
      (await listModelRequests(db, 'IN_PROGRESS')).some((r) => r.id === created.request?.id),
    ).toBe(true);

    await db.modelRequest.delete({ where: { id: created.request.id } });
    await db.workspace.delete({ where: { id: workspace.id } });
  });
});
