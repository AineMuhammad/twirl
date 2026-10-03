import type { ProductConfig } from '@twirl/config-schema';

import { planDefinition } from '@/config/plans';
import type { PrismaClient } from '@/generated/prisma/client';

import { validateConfig } from './products';

export interface PublishedProduct {
  publicId: string;
  config: ProductConfig;
  /** Object key of the model in storage. */
  modelKey: string;
  watermark: boolean;
}

/**
 * A product's live version, for public pages (embed, share links). Returns null unless the product
 * is published. Selects only what shoppers may see: nothing about the workspace beyond its plan.
 */
export async function getPublishedProduct(
  db: PrismaClient,
  publicId: string,
): Promise<PublishedProduct | null> {
  if (!/^[0-9A-Za-z]{6,32}$/.test(publicId)) return null;
  const product = await db.product.findFirst({
    where: { publicId, archivedAt: null, publishedVersionId: { not: null } },
    select: {
      publicId: true,
      workspace: { select: { plan: true } },
      publishedVersion: {
        select: { config: true, modelAsset: { select: { key: true, status: true } } },
      },
    },
  });
  const version = product?.publishedVersion;
  const asset = version?.modelAsset;
  if (!product || !version || !asset || asset.status !== 'READY') return null;
  const parsed = validateConfig(version.config);
  if (!parsed.ok) {
    console.error('[embed] published config failed to parse', publicId, parsed.issues);
    return null;
  }
  return {
    publicId: product.publicId,
    config: parsed.config,
    modelKey: asset.key,
    watermark: planDefinition(product.workspace.plan).watermark,
  };
}
