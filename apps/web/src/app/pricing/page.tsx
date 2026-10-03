import type { Metadata } from 'next';
import Link from 'next/link';

import { APP_NAME } from '@/config/app';
import { PLAN_ORDER, planHighlights, planPriceLabel, PLANS, SHARED_FEATURES } from '@/config/plans';
import { getCurrentUser } from '@/server/auth/session';
import { databaseEnabled, db } from '@/server/db';

import { UpgradeButton } from './UpgradeButton';

export const metadata: Metadata = {
  title: 'Pricing',
  description: `Plans for ${APP_NAME} 3D product configurators.`,
};

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

function Check() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden
      className="mt-0.5 shrink-0 text-brand-600"
    >
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default async function PricingPage() {
  const user = await getCurrentUser();
  const membership =
    user && databaseEnabled
      ? await db().membership.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: 'asc' },
          select: { workspace: { select: { plan: true } } },
        })
      : null;
  const currentPlan = membership?.workspace.plan ?? null;

  return (
    <div className="min-h-dvh bg-tint text-ink">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link
          href="/"
          className={`rounded-md font-display text-[28px] leading-none tracking-tight ${focusRing}`}
        >
          {APP_NAME}
          <span className="text-brand-600 italic">.</span>
        </Link>
        <Link
          href="/dashboard"
          className={`flex h-10 items-center rounded-lg border border-line bg-surface px-4 text-[15px] font-medium shadow-sm hover:bg-tint ${focusRing}`}
        >
          {user ? 'Dashboard' : 'Sign in'}
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-5 pt-12 pb-24">
        <div className="max-w-2xl">
          <h1 className="text-[40px] font-semibold tracking-tight sm:text-[48px]">Simple plans</h1>
          <p className="mt-3 text-[18px] text-ink-soft">
            Start free with one product. Upgrade when you need more.
          </p>
        </div>

        <ul className="mt-12 grid gap-5 lg:grid-cols-3">
          {PLAN_ORDER.map((id) => {
            const plan = PLANS[id];
            const current = currentPlan === id;
            const featured = id === 'STARTER';
            return (
              <li
                key={id}
                className={`flex flex-col rounded-3xl bg-surface p-7 ring-1 ${featured ? 'ring-2 ring-brand-500' : 'ring-line'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-[20px] font-semibold">{plan.label}</h2>
                  {current ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[12px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                      Your plan
                    </span>
                  ) : (
                    featured && (
                      <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[12px] font-medium text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
                        Popular
                      </span>
                    )
                  )}
                </div>
                <p className="mt-1 text-[15px] text-ink-muted">{plan.summary}</p>
                <p className="mt-6 text-[32px] font-semibold tracking-tight">
                  {planPriceLabel(plan)}
                </p>
                <ul className="mt-6 flex-1 space-y-2.5 text-[15px]">
                  {[...planHighlights(plan), ...SHARED_FEATURES].map((feature) => (
                    <li key={feature} className="flex gap-2.5">
                      <Check />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  {current ? (
                    <Link
                      href="/dashboard"
                      className={`flex h-11 items-center justify-center rounded-xl border border-line text-[15px] font-medium hover:bg-tint ${focusRing}`}
                    >
                      Go to dashboard
                    </Link>
                  ) : id === 'FREE' ? (
                    <Link
                      href="/dashboard"
                      className={`flex h-11 items-center justify-center rounded-xl border border-line text-[15px] font-medium hover:bg-tint ${focusRing}`}
                    >
                      {user ? 'Go to dashboard' : 'Start free'}
                    </Link>
                  ) : user ? (
                    <UpgradeButton plan={id} email={user.email} />
                  ) : (
                    <Link
                      href="/signin?callbackUrl=%2Fpricing"
                      className={`flex h-11 items-center justify-center rounded-xl bg-brand-600 text-[15px] font-semibold text-white hover:bg-brand-700 ${focusRing}`}
                    >
                      Sign in to upgrade
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-10 text-center text-[15px] text-ink-muted">
          Don&apos;t have a 3D model of your product?{' '}
          <Link
            href="/request-model"
            className="font-medium text-brand-700 hover:underline dark:text-brand-200"
          >
            We can make one
          </Link>
        </p>
      </main>
    </div>
  );
}
