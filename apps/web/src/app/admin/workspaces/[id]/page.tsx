import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PLANS } from '@/config/plans';
import { getWorkspaceDetail } from '@/server/admin';
import { requireAdmin } from '@/server/auth/session';
import { db } from '@/server/db';

import { PlanSelect } from '../PlanSelect';

const fmt = (d: Date) => d.toLocaleDateString('en-US', { dateStyle: 'medium' });

export default async function WorkspaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin('/admin/workspaces');
  const detail = await getWorkspaceDetail(db(), (await params).id);
  if (!detail) notFound();
  const { workspace, quotes30d, assets, planSetBy } = detail;
  const live = workspace.products.filter((p) => p.publishedVersion).length;
  const plan = PLANS[workspace.plan];

  return (
    <div className="space-y-6">
      <Link
        href="/admin/workspaces"
        className="text-[14px] font-medium text-ink-soft hover:text-ink"
      >
        ← All workspaces
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{workspace.name}</h1>
        <p className="mt-1 text-[14px] text-ink-muted">Created {fmt(workspace.createdAt)}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {(
          [
            ['Live products', `${live} / ${plan.maxPublishedProducts}`],
            ['All products', String(workspace.products.length)],
            ['Models', String(assets)],
            ['Quotes (30 days)', String(quotes30d)],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="rounded-xl bg-surface p-4 ring-1 ring-line">
            <p className="text-[13px] text-ink-muted">{label}</p>
            <p className="mt-1 text-[22px] font-semibold text-ink tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl bg-surface p-5 ring-1 ring-line" aria-labelledby="plan">
        <h2 id="plan" className="text-[16px] font-semibold text-ink">
          Plan
        </h2>
        <div className="mt-3">
          <PlanSelect
            workspaceId={workspace.id}
            workspaceName={workspace.name}
            plan={workspace.plan}
          />
        </div>
        <p className="mt-2 text-[13px] text-ink-muted">
          {workspace.planSetAt
            ? `Last changed ${fmt(workspace.planSetAt)}${planSetBy ? ` by ${planSetBy}` : ''}.`
            : 'Never changed by an admin.'}
        </p>
      </section>

      <section className="rounded-xl bg-surface p-5 ring-1 ring-line" aria-labelledby="people">
        <h2 id="people" className="text-[16px] font-semibold text-ink">
          People
        </h2>
        <ul className="mt-3 divide-y divide-line">
          {workspace.memberships.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 py-2.5 text-[14px]">
              <span className="text-ink">
                {m.user.name ? `${m.user.name} · ` : ''}
                <a
                  href={`mailto:${m.user.email}`}
                  className="text-brand-700 hover:underline dark:text-brand-200"
                >
                  {m.user.email}
                </a>
              </span>
              <span className="text-ink-muted">
                {m.role === 'OWNER' ? 'Owner' : 'Member'} · joined {fmt(m.user.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl bg-surface p-5 ring-1 ring-line" aria-labelledby="products">
        <h2 id="products" className="text-[16px] font-semibold text-ink">
          Products
        </h2>
        {workspace.products.length === 0 ? (
          <p className="mt-2 text-[14px] text-ink-muted">No products yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {workspace.products.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-[14px]">
                <span className="text-ink">{p.name}</span>
                <span className="flex items-center gap-3 text-ink-muted">
                  {p.publishedVersion ? (
                    <a
                      href={`/embed/${p.publicId}`}
                      target="_blank"
                      rel="noopener"
                      className="text-brand-700 hover:underline dark:text-brand-200"
                    >
                      Live v{p.publishedVersion.number} ↗
                    </a>
                  ) : (
                    'Draft'
                  )}
                  <span>edited {fmt(p.updatedAt)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
