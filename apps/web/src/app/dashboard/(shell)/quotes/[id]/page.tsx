import { formatPrice } from '@twirl/config-schema';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { requireWorkspace } from '@/server/auth/session';
import { db } from '@/server/db';
import { getQuote, setQuoteStatus } from '@/server/quotes';

import { setQuoteStatusAction } from '../actions';

export const metadata: Metadata = { title: 'Quote' };

const buttonClass =
  'inline-flex h-10 items-center rounded-lg px-4 text-[14px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { workspace } = await requireWorkspace();
  const found = await getQuote(db(), workspace.id, (await params).id);
  if (!found) notFound();
  const { quote, lines, breakdown } = found;
  // Opening a new quote marks it read.
  if (quote.status === 'NEW') await setQuoteStatus(db(), workspace.id, quote.id, 'READ');
  const archived = quote.status === 'ARCHIVED';
  const subject = encodeURIComponent(`Your ${quote.product.name} quote`);

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/quotes"
        className="text-[14px] font-medium text-ink-soft hover:text-ink"
      >
        ← All quotes
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-tight text-ink">{quote.name}</h1>
          <p className="mt-1 text-[15px] text-ink-muted">
            {quote.product.name} · version {quote.version.number} ·{' '}
            {quote.createdAt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`mailto:${quote.email}?subject=${subject}`}
            className={`${buttonClass} bg-brand-600 text-white shadow-sm hover:bg-brand-700`}
          >
            Reply by email
          </a>
          <form action={setQuoteStatusAction}>
            <input type="hidden" name="id" value={quote.id} />
            <input type="hidden" name="status" value={archived ? 'READ' : 'ARCHIVED'} />
            <button
              type="submit"
              className={`${buttonClass} border border-line bg-surface text-ink hover:bg-tint`}
            >
              {archived ? 'Move to inbox' : 'Archive'}
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="rounded-xl bg-surface p-6 ring-1 ring-line" aria-labelledby="design">
          <h2 id="design" className="text-[17px] font-semibold text-ink">
            Their design
          </h2>
          <dl className="mt-4 divide-y divide-line">
            {lines.map((line) => (
              <div key={line.group} className="flex justify-between gap-4 py-2.5 text-[15px]">
                <dt className="text-ink-muted">{line.label}</dt>
                <dd className="text-right text-ink">{line.value}</dd>
              </div>
            ))}
          </dl>
          <h3 className="mt-6 text-[13px] font-semibold tracking-wide text-ink-soft uppercase">
            Price
          </h3>
          <dl className="mt-2 space-y-1.5 text-[15px]">
            {breakdown.map((line) => (
              <div key={`${line.group}-${line.label}`} className="flex justify-between gap-4">
                <dt className="text-ink-muted">
                  {line.group === 'base' ? 'Base price' : line.label}
                </dt>
                <dd className="text-ink tabular-nums">
                  {line.group === 'base' ? '' : line.amount < 0 ? '−' : '+'}
                  {formatPrice(Math.abs(line.amount), quote.currency)}
                </dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 border-t border-line pt-2 text-[17px] font-semibold">
              <dt className="text-ink">Total</dt>
              <dd className="text-ink tabular-nums">
                {formatPrice(quote.priceTotal, quote.currency)}
              </dd>
            </div>
          </dl>
        </section>

        <aside className="space-y-6">
          <section className="rounded-xl bg-surface p-6 ring-1 ring-line" aria-labelledby="contact">
            <h2 id="contact" className="text-[17px] font-semibold text-ink">
              Contact
            </h2>
            <dl className="mt-3 space-y-2 text-[15px]">
              <div>
                <dt className="text-[13px] text-ink-muted">Email</dt>
                <dd>
                  <a
                    href={`mailto:${quote.email}`}
                    className="text-brand-700 hover:underline dark:text-brand-200"
                  >
                    {quote.email}
                  </a>
                </dd>
              </div>
              {quote.phone && (
                <div>
                  <dt className="text-[13px] text-ink-muted">Phone</dt>
                  <dd>
                    <a
                      href={`tel:${quote.phone}`}
                      className="text-brand-700 hover:underline dark:text-brand-200"
                    >
                      {quote.phone}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </section>
          {quote.message && (
            <section
              className="rounded-xl bg-surface p-6 ring-1 ring-line"
              aria-labelledby="message"
            >
              <h2 id="message" className="text-[17px] font-semibold text-ink">
                Message
              </h2>
              <p className="mt-3 text-[15px] whitespace-pre-wrap text-ink-soft">{quote.message}</p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
