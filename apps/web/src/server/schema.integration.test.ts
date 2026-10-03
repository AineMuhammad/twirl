import { PrismaPg } from '@prisma/adapter-pg';
import { afterAll, describe, expect, it } from 'vitest';

import { PrismaClient } from '@/generated/prisma/client';

// Runs against a real, migrated Postgres (CI service, or `docker compose up -d` locally) when
// DATABASE_URL is set; skipped otherwise.
const url = process.env.DATABASE_URL;
const prisma = url ? new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) }) : null;

afterAll(async () => {
  await prisma?.$disconnect();
});

describe.skipIf(!prisma)('database schema', () => {
  const db = prisma as PrismaClient;
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  it('creates a workspace with its owner and cascades deletes to workspace data', async () => {
    const user = await db.user.create({ data: { email: `owner-${unique}@example.com` } });
    const workspace = await db.workspace.create({
      data: {
        name: 'Test workspace',
        memberships: { create: { userId: user.id } },
        products: {
          create: {
            publicId: `p-${unique}`,
            name: 'Chair',
            versions: { create: { number: 1, config: { schemaVersion: 1 }, schemaVersion: 1 } },
          },
        },
      },
      include: { memberships: true, products: { include: { versions: true } } },
    });
    expect(workspace.plan).toBe('FREE');
    expect(workspace.memberships[0]?.role).toBe('OWNER');
    expect(workspace.products[0]?.versions[0]?.status).toBe('DRAFT');

    await db.workspace.delete({ where: { id: workspace.id } });
    expect(await db.product.count({ where: { workspaceId: workspace.id } })).toBe(0);
    expect(await db.membership.count({ where: { workspaceId: workspace.id } })).toBe(0);
    // Users outlive their workspaces.
    expect(await db.user.findUnique({ where: { id: user.id } })).not.toBeNull();
    await db.user.delete({ where: { id: user.id } });
  });

  it('numbers versions uniquely per product', async () => {
    const workspace = await db.workspace.create({
      data: {
        name: 'Versions',
        products: { create: { publicId: `v-${unique}`, name: 'Table' } },
      },
      include: { products: true },
    });
    const productId = workspace.products[0]?.id ?? '';
    const version = { productId, number: 1, config: {}, schemaVersion: 1 };
    await db.productVersion.create({ data: version });
    await expect(db.productVersion.create({ data: version })).rejects.toThrow();
    await db.workspace.delete({ where: { id: workspace.id } });
  });
});
