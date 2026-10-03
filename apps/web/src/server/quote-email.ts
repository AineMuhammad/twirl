import { APP_NAME } from '@/config/app';

import { escapeHtml } from './email';
import type { QuoteForEmail } from './quotes';

/** The merchant's "new quote request" email, as text and simple HTML. */
export function quoteEmail(quote: QuoteForEmail, quoteUrl: string) {
  const subject = `New quote request: ${quote.productName} (${quote.price})`;
  const contact = [quote.name, quote.email, quote.phone].filter(Boolean).join(' · ');
  const text = [
    `New quote request for ${quote.productName}`,
    '',
    `From: ${contact}`,
    `Price: ${quote.price}`,
    '',
    ...quote.lines.map((l) => `${l.label}: ${l.value}`),
    ...(quote.message ? ['', 'Message:', quote.message] : []),
    '',
    `Open it in ${APP_NAME}: ${quoteUrl}`,
    'Reply to this email to answer the customer directly.',
  ].join('\n');
  const rows = quote.lines
    .map(
      (l) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#737373">${escapeHtml(l.label)}</td><td style="padding:4px 0">${escapeHtml(l.value)}</td></tr>`,
    )
    .join('');
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;color:#171717;line-height:1.5">
<h2 style="margin:0 0 4px;font-size:18px">New quote request for ${escapeHtml(quote.productName)}</h2>
<p style="margin:0 0 16px;color:#404040">${escapeHtml(contact)}</p>
<p style="margin:0 0 8px;font-size:20px;font-weight:600">${escapeHtml(quote.price)}</p>
<table style="border-collapse:collapse;margin:0 0 16px">${rows}</table>
${quote.message ? `<p style="margin:0 0 4px;color:#737373">Message</p><p style="margin:0 0 16px;white-space:pre-wrap">${escapeHtml(quote.message)}</p>` : ''}
<p style="margin:0"><a href="${escapeHtml(quoteUrl)}" style="color:#4f46e5">Open it in ${APP_NAME}</a> · Reply to this email to answer the customer directly.</p>
</div>`;
  return { subject, text, html };
}
