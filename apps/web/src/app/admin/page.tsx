import Link from 'next/link';

import { PLAN_ORDER, PLANS } from '@/config/plans';
import { adminStats } from '@/server/admin';
import { requireAdmin } from '@/server/auth/session';
import { db } from '@/server/db';

export default async function AdminOverviewPage() {
  await requireAdmin();
  const stats = await adminStats(db());
  const tiles = [
    { label: 'Workspaces', value: stats.workspaces, href: '/admin/workspaces' },
    { label: 'Users', value: stats.users, href: null },
    { label: 'Live products', value: stats.liveProducts, href: null },
    { label: 'Quotes (30 days)', value: stats.quotes30d, href: null },
    { label: 'New model requests', value: stats.newModelRequests, href: '/admin/model-requests' },
  ];
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Overview</h1>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {tiles.map((t) => {
          const body = (
            <>
              <p className="text-[13px] text-ink-muted">{t.label}</p>
              <p className="mt-1 text-[26px] font-semibold text-ink tabular-nums">{t.value}</p>
            </>
          );
          return (
            <li key={t.label}>
              {t.href ? (
                <Link
                  href={t.href}
                  className="hover:ring-brand-300 block rounded-2xl bg-surface p-4 ring-1 ring-line"
                >
                  {body}
                </Link>
              ) : (
                <div className="rounded-2xl bg-surface p-4 ring-1 ring-line">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
      <section className="rounded-2xl bg-surface p-5 ring-1 ring-line" aria-labelledby="plans">
        <h2 id="plans" className="text-[16px] font-semibold text-ink">
          Workspaces by plan
        </h2>
        <dl className="mt-3 grid grid-cols-3 gap-4">
          {PLAN_ORDER.map((p) => (
            <div key={p}>
              <dt className="text-[13px] text-ink-muted">{PLANS[p].label}</dt>
              <dd className="text-[20px] font-semibold text-ink tabular-nums">
                {stats.byPlan[p] ?? 0}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
