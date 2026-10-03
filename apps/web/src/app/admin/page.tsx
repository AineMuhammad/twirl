import { PLANS } from '@/config/plans';
import { requireAdmin } from '@/server/auth/session';
import { db } from '@/server/db';

import { PlanSelect } from './PlanSelect';

const PAGE_SIZE = 50;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const q = (await searchParams).q?.trim().slice(0, 100) ?? '';
  const workspaces = await db().workspace.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            {
              memberships: {
                some: { user: { email: { contains: q, mode: 'insensitive' } } },
              },
            },
          ],
        }
      : {},
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE,
    include: {
      memberships: {
        where: { role: 'OWNER' },
        take: 1,
        include: { user: { select: { email: true } } },
      },
      _count: {
        select: { products: { where: { publishedVersionId: { not: null }, archivedAt: null } } },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Workspaces</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Set plans by hand (no billing yet). Newest first
            {workspaces.length === PAGE_SIZE ? `, first ${PAGE_SIZE} shown` : ''}.
          </p>
        </div>
        <form className="flex gap-2" role="search">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Workspace or owner email"
            aria-label="Search workspaces"
            className="w-64 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-ink focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-tint"
          >
            Search
          </button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-surface ring-1 ring-line">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs text-ink-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Workspace
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Owner
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Published
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Created
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Plan
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {workspaces.map((w) => (
              <tr key={w.id}>
                <td className="px-4 py-3 font-medium text-ink">{w.name}</td>
                <td className="px-4 py-3 text-ink-soft">{w.memberships[0]?.user.email ?? '—'}</td>
                <td className="px-4 py-3 text-ink-soft tabular-nums">
                  {w._count.products} / {PLANS[w.plan].maxPublishedProducts}
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {w.createdAt.toLocaleDateString('en-US')}
                </td>
                <td className="px-4 py-3">
                  <PlanSelect workspaceId={w.id} workspaceName={w.name} plan={w.plan} />
                </td>
              </tr>
            ))}
            {workspaces.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-muted">
                  No workspaces found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
