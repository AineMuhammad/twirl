import { formatPrice } from '@twirl/config-schema';
import type { Metadata } from 'next';
import Link from 'next/link';

import { requireWorkspace } from '@/server/auth/session';
import { db } from '@/server/db';
import { listQuotes } from '@/server/quotes';

export const metadata: Metadata = { title: 'Quotes' };

const tabClass = (active: boolean) =>
  `flex h-9 items-center rounded-lg px-3.5 text-[14px] font-medium ${active ? 'bg-surface text-ink shadow-sm ring-1 ring-line' : 'text-ink-muted hover:text-ink'}`;

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { workspace } = await requireWorkspace();
  const archived = (await searchParams).view === 'archived';
  const quotes = await listQuotes(db(), workspace.id, archived ? 'ARCHIVED' : 'open');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-ink">Quotes</h1>
          <p className="mt-1 text-[15px] text-ink-muted">
            Requests from shoppers, with their design and the price.
          </p>
        </div>
        <nav aria-label="Quote views" className="flex gap-1 rounded-xl bg-tint-strong p-1">
          <Link
            href="/dashboard/quotes"
            className={tabClass(!archived)}
            aria-current={!archived ? 'page' : undefined}
          >
            Inbox
          </Link>
          <Link
            href="/dashboard/quotes?view=archived"
            className={tabClass(archived)}
            aria-current={archived ? 'page' : undefined}
          >
            Archived
          </Link>
        </nav>
      </div>

      {quotes.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-line bg-surface/50 px-6 py-12 text-center">
          <p className="text-[15px] font-medium text-ink">
            {archived ? 'No archived quotes' : 'No quote requests yet'}
          </p>
          {!archived && (
            <p className="mt-1 text-[14px] text-ink-muted">
              They appear here when shoppers click “Get a quote” on a published product.
            </p>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-surface ring-1 ring-line">
          {quotes.map((q) => {
            const isNew = q.status === 'NEW';
            return (
              <li key={q.id}>
                <Link
                  href={`/dashboard/quotes/${q.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-tint"
                >
                  <span
                    aria-hidden
                    className={`size-2 shrink-0 rounded-full ${isNew ? 'bg-brand-600' : 'bg-transparent'}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate text-[15px] text-ink ${isNew ? 'font-semibold' : ''}`}
                    >
                      {q.name}
                      {isNew && <span className="sr-only"> (new)</span>}
                    </span>
                    <span className="block truncate text-[13px] text-ink-muted">
                      {q.product.name} · {q.email}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-[15px] font-medium text-ink tabular-nums">
                      {formatPrice(q.priceTotal, q.currency)}
                    </span>
                    <span className="block text-[13px] text-ink-muted">
                      {q.createdAt.toLocaleDateString('en-US', { dateStyle: 'medium' })}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
