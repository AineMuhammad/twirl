import { evaluate } from '@twirl/config-schema';

import { planDefinition, trialState } from '@/config/plans';
import type { Prisma, PrismaClient } from '@/generated/prisma/client';

import { workspaceNotLocked } from './plans';
import { newPublicId, validateConfig } from './products';

/**
 * Share links: a shopper's choices saved against the exact published version they saw, so the
 * link shows the same design even after the merchant publishes changes.
 */

/** Saved choices stay small: real configurations are a few hundred bytes. */
export const MAX_SELECTIONS_BYTES = 8_000;
const PUBLIC_ID = /^[0-9A-Za-z]{6,32}$/;

export type CreateShareResult = { ok: true; shortId: string } | { ok: false; error: string };

export async function createShare(
  db: PrismaClient,
  input: { publicId: unknown; versionId: unknown; selections: unknown },
): Promise<CreateShareResult> {
  const { publicId, versionId, selections } = input;
  if (typeof publicId !== 'string' || !PUBLIC_ID.test(publicId)) {
    return { ok: false, error: 'This product is not available.' };
  }
  if (typeof versionId !== 'string' || versionId.length > 64) {
    return { ok: false, error: 'This product is not available.' };
  }
  if (typeof selections !== 'object' || selections === null || Array.isArray(selections)) {
    return { ok: false, error: 'Nothing to share.' };
  }
  if (JSON.stringify(selections).length > MAX_SELECTIONS_BYTES) {
    return { ok: false, error: 'This design is too large to share.' };
  }

  // Only published versions of live (not archived) products can be shared.
  const version = await db.productVersion.findFirst({
    where: {
      id: versionId,
      status: 'PUBLISHED',
      product: {
        publicId,
        archivedAt: null,
        publishedVersionId: { not: null },
        workspace: workspaceNotLocked(),
      },
    },
    select: { id: true, config: true },
  });
  if (!version) return { ok: false, error: 'This product is not available.' };
  const parsed = validateConfig(version.config);
  if (!parsed.ok) return { ok: false, error: 'This product is not available.' };

  // Store what the shopper actually sees: valid, rule-corrected choices.
  const resolved = evaluate(parsed.config, selections).selections;
  for (let attempt = 0; attempt < 3; attempt++) {
    const shortId = newPublicId(10);
    try {
      await db.sharedConfiguration.create({
        data: {
          shortId,
          versionId: version.id,
          selections: resolved as Prisma.InputJsonObject,
        },
      });
      return { ok: true, shortId };
    } catch (error) {
      // A short id collision is astronomically unlikely; retry with a new one.
      if ((error as { code?: string }).code !== 'P2002') throw error;
    }
  }
  return { ok: false, error: 'Could not create a link. Please try again.' };
}

/** A shared design, or null if the link is unknown or its product was removed. */
export async function getShare(db: PrismaClient, shortId: string) {
  if (!/^[0-9A-Za-z]{6,32}$/.test(shortId)) return null;
  const share = await db.sharedConfiguration.findUnique({
    where: { shortId },
    select: {
      selections: true,
      version: {
        select: {
          id: true,
          config: true,
          modelAsset: { select: { key: true, status: true } },
          product: {
            select: {
              publicId: true,
              archivedAt: true,
              workspace: { select: { plan: true, trialEndsAt: true } },
            },
          },
        },
      },
    },
  });
  const version = share?.version;
  const asset = version?.modelAsset;
  if (!share || !version || version.product.archivedAt || !asset || asset.status !== 'READY') {
    return null;
  }
  const parsed = validateConfig(version.config);
  if (!parsed.ok) return null;
  return {
    publicId: version.product.publicId,
    versionId: version.id,
    config: parsed.config,
    selections: (share.selections ?? {}) as Record<string, unknown>,
    modelKey: asset.key,
    watermark: planDefinition(version.product.workspace.plan).watermark,
    locked: trialState(version.product.workspace.plan, version.product.workspace.trialEndsAt).ended,
  };
}
