import Link from 'next/link';

import { PLANS } from '@/config/plans';
import { listWorkspaces } from '@/server/admin';
import { requireAdmin } from '@/server/auth/session';
import { db } from '@/server/db';

import { PlanSelect } from './PlanSelect';

export default async function WorkspacesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireAdmin('/admin/workspaces');
  const params = await searchParams;
  const { items, total, page, pages, q } = await listWorkspaces(db(), {
    ...(params.q && { q: params.q }),
    page: Number(params.page) || 1,
  });
  const pageHref = (n: number) =>
    `/admin/workspaces?${new URLSearchParams({ ...(q && { q }), page: String(n) })}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Workspaces</h1>
          <p className="mt-1 text-[14px] text-ink-muted">
            {total} workspace{total === 1 ? '' : 's'}
            {q ? ` matching “${q}”` : ''}. Set plans by hand (no billing yet).
          </p>
        </div>
        <form className="flex gap-2" role="search">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Workspace or owner email"
            aria-label="Search workspaces"
            className="h-9 w-64 rounded-lg border border-line bg-surface px-3 text-[14px] text-ink focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
          />
          <button
            type="submit"
            className="h-9 rounded-lg border border-line bg-surface px-3 text-[14px] font-medium text-ink-soft hover:bg-tint"
          >
            Search
          </button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-surface ring-1 ring-line">
        <table className="w-full text-left text-[14px]">
          <thead className="border-b border-line text-[13px] text-ink-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Workspace
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Owner
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Live
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
            {items.map((w) => (
              <tr key={w.id}>
                <td className="px-4 py-3 font-medium">
                  <Link
                    href={`/admin/workspaces/${w.id}`}
                    className="text-ink hover:text-brand-700 hover:underline dark:hover:text-brand-200"
                  >
                    {w.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-soft">{w.memberships[0]?.user.email ?? '—'}</td>
                <td className="px-4 py-3 text-ink-soft tabular-nums">
                  {w._count.products} / {PLANS[w.plan].maxPublishedProducts}
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {w.createdAt.toLocaleDateString('en-US', { dateStyle: 'medium' })}
                </td>
                <td className="px-4 py-3">
                  <PlanSelect workspaceId={w.id} workspaceName={w.name} plan={w.plan} />
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-muted">
                  No workspaces found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav aria-label="Pages" className="flex items-center justify-between text-[14px]">
          {page > 1 ? (
            <Link
              href={pageHref(page - 1)}
              className="rounded-lg border border-line bg-surface px-3 py-1.5 font-medium text-ink-soft hover:bg-tint"
            >
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-ink-muted">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link
              href={pageHref(page + 1)}
              className="rounded-lg border border-line bg-surface px-3 py-1.5 font-medium text-ink-soft hover:bg-tint"
            >
              Older →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
