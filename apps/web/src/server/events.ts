import type { PrismaClient } from '@/generated/prisma/client';
import { type EventBatch, eventBatchSchema, type EventType } from '@/lib/events';

/**
 * Records a batch of anonymous events for a live product. Invalid or unknown batches are dropped
 * (returns false); callers don't tell the browser why.
 */
export async function recordEvents(db: PrismaClient, input: unknown): Promise<boolean> {
  const parsed = eventBatchSchema.safeParse(input);
  if (!parsed.success) return false;
  const batch: EventBatch = parsed.data;
  const product = await db.product.findFirst({
    where: { publicId: batch.publicId, archivedAt: null, publishedVersionId: { not: null } },
    select: { id: true, versions: { where: { id: batch.versionId ?? '' }, select: { id: true } } },
  });
  if (!product) return false;
  // Keep the version only if it really belongs to this product.
  const versionId = product.versions[0]?.id ?? null;
  await db.event.createMany({
    data: batch.events.map((e) => ({
      productId: product.id,
      versionId,
      type: e.type,
      sessionId: batch.sessionId,
      ...(e.group && { payload: { group: e.group } }),
    })),
  });
  return true;
}

export type EventCounts = Record<EventType, number> & { visitors: number };

const EMPTY: EventCounts = {
  view: 0,
  option_change: 0,
  share: 0,
  image_download: 0,
  quote_request: 0,
  visitors: 0,
};

/**
 * Counts per product over the last `days`, for products in this workspace only. `visitors` is
 * the number of distinct visits that viewed the product.
 */
export async function eventCounts(
  db: PrismaClient,
  workspaceId: string,
  productIds: string[],
  days = 30,
): Promise<Map<string, EventCounts>> {
  const result = new Map<string, EventCounts>(productIds.map((id) => [id, { ...EMPTY }]));
  if (productIds.length === 0) return result;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await db.$queryRaw<
    { productId: string; type: string; count: number; sessions: number }[]
  >`
    SELECT e."productId", e."type", COUNT(*)::int AS count, COUNT(DISTINCT e."sessionId")::int AS sessions
    FROM "Event" e
    JOIN "Product" p ON p."id" = e."productId"
    WHERE p."workspaceId" = ${workspaceId}
      AND e."productId" = ANY(${productIds})
      AND e."createdAt" >= ${since}
    GROUP BY e."productId", e."type"`;
  for (const row of rows) {
    const counts = result.get(row.productId);
    if (!counts || !(row.type in EMPTY)) continue;
    counts[row.type as EventType] = row.count;
    if (row.type === 'view') counts.visitors = row.sessions;
  }
  return result;
}
