import { type PlanDefinition, planDefinition, TRIAL_DAYS, trialState } from '@/config/plans';
import type { Prisma, PrismaClient } from '@/generated/prisma/client';
import type { Plan } from '@/generated/prisma/enums';

type Db = PrismaClient | Prisma.TransactionClient;

export interface PublishCheck {
  allowed: boolean;
  /** Live products right now. */
  used: number;
  limit: number;
  plan: Plan;
  /** The free trial is over: nothing can be published until the workspace upgrades. */
  trialEnded: boolean;
}

/**
 * Whether one more product may go live. Re-publishing a product that's already live doesn't use
 * another slot.
 */
export function canPublish(plan: PlanDefinition, used: number, alreadyPublished: boolean): boolean {
  return alreadyPublished || used < plan.maxPublishedProducts;
}

/** Live (published, not archived) products in a workspace. */
export function countPublishedProducts(db: Db, workspaceId: string) {
  return db.product.count({
    where: { workspaceId, publishedVersionId: { not: null }, archivedAt: null },
  });
}

export async function checkPublish(
  db: Db,
  workspaceId: string,
  productId?: string,
): Promise<PublishCheck> {
  const workspace = await db.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    select: { plan: true, trialEndsAt: true },
  });
  const plan = planDefinition(workspace.plan);
  const trialEnded = trialState(workspace.plan, workspace.trialEndsAt).ended;
  const used = await countPublishedProducts(db, workspaceId);
  const alreadyPublished = productId
    ? (await db.product.count({
        where: { id: productId, workspaceId, publishedVersionId: { not: null }, archivedAt: null },
      })) > 0
    : false;
  return {
    allowed: !trialEnded && canPublish(plan, used, alreadyPublished),
    used,
    limit: plan.maxPublishedProducts,
    plan: workspace.plan,
    trialEnded,
  };
}

export class PlanLimitError extends Error {
  constructor(readonly check: PublishCheck) {
    super(
      check.trialEnded
        ? `Your ${TRIAL_DAYS}-day free trial has ended. Upgrade to publish.`
        : check.plan === 'FREE'
          ? `The free trial includes ${check.limit} live product. Unpublish it or upgrade to publish more.`
          : `Your ${planDefinition(check.plan).label} plan allows ${check.limit} published ` +
            `products. Unpublish one or upgrade to publish more.`,
    );
    this.name = 'PlanLimitError';
  }
}

/**
 * Throws `PlanLimitError` if publishing `productId` would exceed the plan. Call it inside the
 * publish transaction, so two simultaneous publishes can't both squeeze past the limit.
 */
export async function assertCanPublish(db: Db, workspaceId: string, productId: string) {
  // Serialise publishes per workspace until the surrounding transaction ends.
  await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`publish:${workspaceId}`}))`;
  const check = await checkPublish(db, workspaceId, productId);
  if (!check.allowed) throw new PlanLimitError(check);
  return check;
}

/**
 * Prisma filter for workspaces whose products are fully live: a paid plan, or a free trial that
 * hasn't ended. Products outside it show a still image and take no quotes or share links.
 */
export function workspaceNotLocked(now = new Date()) {
  return { OR: [{ plan: { not: 'FREE' as const } }, { trialEndsAt: { gt: now } }] };
}
