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

/** Length of the free trial. After it, Free products show a still image and can't be published. */
export const TRIAL_DAYS = 14;

/**
 * Every plan's limits, in one place. Change limits or prices here only. Enforcement happens on
 * the server (`src/server/plans.ts`); the UI reads this for display.
 */
export const PLANS = {
  FREE: {
    label: 'Free trial',
    monthlyPriceUsd: 0,
    maxPublishedProducts: 1,
    watermark: true,
    summary: `Try it with one product for ${TRIAL_DAYS} days.`,
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

export interface TrialState {
  /** On the Free plan with trial days left. */
  active: boolean;
  /** On the Free plan and past the trial: products show a still image and can't be published. */
  ended: boolean;
  /** Whole days left, rounded up (0 once ended). */
  daysLeft: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Where a workspace is in its free trial. Paid plans have no trial. */
export function trialState(plan: Plan, trialEndsAt: Date, now = new Date()): TrialState {
  if (plan !== 'FREE') return { active: false, ended: false, daysLeft: 0 };
  const left = trialEndsAt.getTime() - now.getTime();
  if (left <= 0) return { active: false, ended: true, daysLeft: 0 };
  return { active: true, ended: false, daysLeft: Math.ceil(left / DAY_MS) };
}

export const PLAN_ORDER: readonly Plan[] = ['FREE', 'STARTER', 'PRO'];

export function planDefinition(plan: Plan): PlanDefinition {
  return PLANS[plan];
}

/** What every plan includes (shown on the pricing page). */
export const SHARED_FEATURES = [
  '3D configurator with colours, add-ons and sizes',
  'Embed on any website',
  'Share links and image downloads',
  'Quote requests to your inbox',
];

/** A plan's own highlights, derived from its limits. */
export function planHighlights(plan: PlanDefinition): string[] {
  const n = plan.maxPublishedProducts;
  return [
    `${n} live product${n === 1 ? '' : 's'}`,
    ...(plan.monthlyPriceUsd === 0 ? [`${TRIAL_DAYS} days, then upgrade to stay live`] : []),
    plan.watermark ? '“Made with Twirl” watermark' : 'No watermark',
    'Unlimited drafts',
  ];
}

/** "$0", "$29 / month" or "Contact us". */
export function planPriceLabel(plan: PlanDefinition): string {
  if (plan.monthlyPriceUsd === null) return 'Contact us';
  if (plan.monthlyPriceUsd === 0) return '$0';
  return `$${plan.monthlyPriceUsd} / month`;
}
