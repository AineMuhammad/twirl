import { after, NextResponse } from 'next/server';

import { apiError } from '@/server/api';
import { databaseEnabled, db } from '@/server/db';
import { sendEmail } from '@/server/email';
import { isSameOrigin } from '@/server/http';
import { quoteEmail } from '@/server/quote-email';
import { createQuote, workspaceOwnerEmails } from '@/server/quotes';

/**
 * A shopper's quote request. Public (no sign-in), so it only accepts requests from Twirl's own
 * pages, validates everything and re-prices on the server. Rate limiting: next branch.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return apiError(403, 'Cross-site request blocked.');
  if (!databaseEnabled) return apiError(503, 'Quotes are not available right now.');
  const body: unknown = await request.json().catch(() => null);
  const result = await createQuote(db(), body);
  if (!result.ok) return apiError(400, result.error);

  const quote = result.quote;
  if (quote) {
    const quoteUrl = `${new URL(request.url).origin}/dashboard/quotes/${quote.id}`;
    // Email after responding, so the shopper isn't kept waiting on the mail provider.
    after(async () => {
      const to = await workspaceOwnerEmails(db(), quote.workspaceId);
      await sendEmail({ to, replyTo: quote.email, ...quoteEmail(quote, quoteUrl) });
    });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
