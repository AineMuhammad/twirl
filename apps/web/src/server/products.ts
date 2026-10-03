import { randomBytes } from 'node:crypto';

import { parseProductConfig, type ProductConfig } from '@twirl/config-schema';

import type { Prisma, PrismaClient } from '@/generated/prisma/client';

/**
 * Product and draft persistence. Every function takes the caller's workspace id and scopes its
 * queries by it; callers get that id from `requireWorkspace()`, never from the request.
 */

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** A short, unguessable id for public URLs (62^12 ≈ 3×10^21). */
export function newPublicId(length = 12): string {
  const bytes = randomBytes(length * 2);
  let id = '';
  for (const byte of bytes) {
    // Rejection sampling keeps every character equally likely.
    if (byte < 248) id += ALPHABET[byte % 62];
    if (id.length === length) break;
  }
  return id.length === length ? id : newPublicId(length);
}

export interface ConfigIssue {
  path: string;
  message: string;
}

export type SaveResult =
  { ok: true; savedAt: string } | { ok: false; error: string; issues?: ConfigIssue[] };

/** Validates a config from the editor; the issues name where each problem is. */
export function validateConfig(
  input: unknown,
): { ok: true; config: ProductConfig } | { ok: false; issues: ConfigIssue[] } {
  const parsed = parseProductConfig(input);
  if (parsed.success) return { ok: true, config: parsed.data };
  const error = parsed.error;
  if (!('issues' in error)) return { ok: false, issues: [{ path: '', message: error.message }] };
  return {
    ok: false,
    issues: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
  };
}

const asJson = (config: ProductConfig) => config as unknown as Prisma.InputJsonObject;

export function listProducts(db: PrismaClient, workspaceId: string) {
  return db.product.findMany({
    where: { workspaceId, archivedAt: null },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, name: true, updatedAt: true, publishedVersionId: true },
  });
}

export async function createProduct(
  db: PrismaClient,
  workspaceId: string,
  userId: string,
  input: { assetId: string; config: unknown },
): Promise<{ ok: true; productId: string } | { ok: false; error: string }> {
  const asset = await db.asset.findFirst({
    where: { id: input.assetId, workspaceId, status: 'READY' },
    select: { id: true },
  });
  if (!asset) return { ok: false, error: 'That model is not available.' };
  const result = validateConfig(input.config);
  if (!result.ok) return { ok: false, error: 'The generated configuration is not valid.' };

  const product = await db.product.create({
    data: {
      workspaceId,
      publicId: newPublicId(),
      name: result.config.product.name,
      versions: {
        create: {
          number: 1,
          config: asJson(result.config),
          schemaVersion: result.config.schemaVersion,
          modelAssetId: asset.id,
          createdById: userId,
        },
      },
    },
    select: { id: true },
  });
  return { ok: true, productId: product.id };
}

/** The product with its current draft and model, or null if it isn't in this workspace. */
export async function getProductForEditor(db: PrismaClient, workspaceId: string, id: string) {
  const product = await db.product.findFirst({
    where: { id, workspaceId, archivedAt: null },
    include: {
      versions: {
        where: { status: 'DRAFT' },
        orderBy: { number: 'desc' },
        take: 1,
        include: { modelAsset: { select: { key: true, filename: true } } },
      },
    },
  });
  const draft = product?.versions[0];
  if (!product || !draft) return null;
  return { product, draft };
}

export async function saveDraft(
  db: PrismaClient,
  workspaceId: string,
  productId: string,
  input: unknown,
): Promise<SaveResult> {
  const result = validateConfig(input);
  if (!result.ok) {
    return {
      ok: false,
      error: 'Fix the highlighted problems before saving.',
      issues: result.issues,
    };
  }
  const found = await getProductForEditor(db, workspaceId, productId);
  if (!found) return { ok: false, error: 'This product no longer exists.' };

  // Drafts only: published versions are immutable.
  const updated = await db.productVersion.updateMany({
    where: { id: found.draft.id, status: 'DRAFT' },
    data: { config: asJson(result.config), schemaVersion: result.config.schemaVersion },
  });
  if (updated.count === 0)
    return { ok: false, error: 'This version was published; reload to keep editing.' };
  const product = await db.product.update({
    where: { id: productId },
    data: { name: result.config.product.name },
    select: { updatedAt: true },
  });
  return { ok: true, savedAt: product.updatedAt.toISOString() };
}
