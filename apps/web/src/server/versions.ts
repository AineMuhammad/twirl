import type { PrismaClient } from '@/generated/prisma/client';

import { assertCanPublish, PlanLimitError } from './plans';
import { asJson, type ConfigIssue, validateConfig } from './products';

/**
 * Publishing and version history. Published versions are immutable: shoppers, share links and
 * quotes always see exactly what was published. Editing continues on a new draft.
 */

export type VersionResult =
  { ok: true; number: number } | { ok: false; error: string; issues?: ConfigIssue[] };

const NOT_FOUND = { ok: false, error: 'This product no longer exists.' } as const;

/** Published versions, newest first, with which one is live. */
export async function listVersions(db: PrismaClient, workspaceId: string, productId: string) {
  const product = await db.product.findFirst({
    where: { id: productId, workspaceId, archivedAt: null },
    select: { publishedVersionId: true },
  });
  if (!product) return [];
  const versions = await db.productVersion.findMany({
    where: { productId, status: 'PUBLISHED' },
    orderBy: { number: 'desc' },
    select: { id: true, number: true, publishedAt: true, config: true },
  });
  return versions.map((v) => ({ ...v, live: v.id === product.publishedVersionId }));
}

/**
 * Publishes `input` (the editor's current config): saves it into the draft, freezes the draft as
 * the live version, and opens a new draft with the same config. Enforces the plan's limit.
 */
export async function publishDraft(
  db: PrismaClient,
  workspaceId: string,
  userId: string,
  productId: string,
  input: unknown,
): Promise<VersionResult> {
  const result = validateConfig(input);
  if (!result.ok) {
    return { ok: false, error: 'Fix the problems before publishing.', issues: result.issues };
  }
  const config = result.config;
  try {
    return await db.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id: productId, workspaceId, archivedAt: null },
        include: {
          versions: { where: { status: 'DRAFT' }, orderBy: { number: 'desc' }, take: 1 },
        },
      });
      const draft = product?.versions[0];
      if (!product || !draft) return NOT_FOUND;

      await assertCanPublish(tx, workspaceId, productId);

      const frozen = await tx.productVersion.updateMany({
        where: { id: draft.id, status: 'DRAFT' },
        data: {
          config: asJson(config),
          schemaVersion: config.schemaVersion,
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      });
      // Someone else published this draft a moment ago.
      if (frozen.count === 0) {
        return { ok: false, error: 'This draft was just published. Reload to continue.' };
      }
      await tx.product.update({
        where: { id: productId },
        data: { publishedVersionId: draft.id, name: config.product.name },
      });
      await tx.productVersion.create({
        data: {
          productId,
          number: draft.number + 1,
          config: asJson(config),
          schemaVersion: config.schemaVersion,
          modelAssetId: draft.modelAssetId,
          createdById: userId,
        },
      });
      return { ok: true, number: draft.number };
    });
  } catch (error) {
    if (error instanceof PlanLimitError) return { ok: false, error: error.message };
    throw error;
  }
}

/** Takes the product off the storefront. Its versions stay in the history. */
export async function unpublish(
  db: PrismaClient,
  workspaceId: string,
  productId: string,
): Promise<{ ok: boolean; error?: string }> {
  const updated = await db.product.updateMany({
    where: { id: productId, workspaceId },
    data: { publishedVersionId: null },
  });
  return updated.count ? { ok: true } : NOT_FOUND;
}

/** Makes an earlier published version live again (a rollback). */
export async function makeLive(
  db: PrismaClient,
  workspaceId: string,
  productId: string,
  versionId: string,
): Promise<VersionResult> {
  try {
    return await db.$transaction(async (tx) => {
      const version = await tx.productVersion.findFirst({
        where: { id: versionId, productId, status: 'PUBLISHED', product: { workspaceId } },
        select: { id: true, number: true },
      });
      if (!version) return NOT_FOUND;
      await assertCanPublish(tx, workspaceId, productId);
      await tx.product.update({
        where: { id: productId },
        data: { publishedVersionId: version.id },
      });
      return { ok: true, number: version.number };
    });
  } catch (error) {
    if (error instanceof PlanLimitError) return { ok: false, error: error.message };
    throw error;
  }
}

/** Copies an earlier version's config into the draft, replacing the draft's. */
export async function copyToDraft(
  db: PrismaClient,
  workspaceId: string,
  productId: string,
  versionId: string,
): Promise<{ ok: true; config: unknown } | { ok: false; error: string }> {
  const source = await db.productVersion.findFirst({
    where: { id: versionId, productId, status: 'PUBLISHED', product: { workspaceId } },
    select: { config: true, schemaVersion: true },
  });
  if (!source) return NOT_FOUND;
  const draft = await db.productVersion.findFirst({
    where: { productId, status: 'DRAFT' },
    orderBy: { number: 'desc' },
    select: { id: true },
  });
  if (!draft) return NOT_FOUND;
  await db.productVersion.update({
    where: { id: draft.id },
    data: { config: source.config ?? {}, schemaVersion: source.schemaVersion },
  });
  return { ok: true, config: source.config };
}
