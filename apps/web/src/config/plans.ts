import type { Plan } from '@/generated/prisma/enums';

export interface PlanDefinition {
  label: string;
  /** Monthly price for the pricing page; null while prices are TBD ("Contact us"). */
  monthlyPriceUsd: number | null;
  /** Products that can be published (live) at once. Drafts are unlimited. */
  maxPublishedProducts: number;
  /** "Made with Twirl" mark on the configurator and downloaded images. */
  watermark: boolean;
  summary: string;
}

/**
 * Every plan's limits, in one place. Change limits or prices here only. Enforcement happens on
 * the server (`src/server/plans.ts`); the UI reads this for display.
 */
export const PLANS = {
  FREE: {
    label: 'Free',
    monthlyPriceUsd: 0,
    maxPublishedProducts: 1,
    watermark: true,
    summary: 'Try it with one product.',
  },
  STARTER: {
    label: 'Starter',
    monthlyPriceUsd: null,
    maxPublishedProducts: 10,
    watermark: false,
    summary: 'For small catalogues.',
  },
  PRO: {
    label: 'Pro',
    monthlyPriceUsd: null,
    maxPublishedProducts: 50,
    watermark: false,
    summary: 'For growing stores.',
  },
} as const satisfies Record<Plan, PlanDefinition>;

export const PLAN_ORDER: readonly Plan[] = ['FREE', 'STARTER', 'PRO'];

export function planDefinition(plan: Plan): PlanDefinition {
  return PLANS[plan];
}
