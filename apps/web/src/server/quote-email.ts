import { renderEmail } from './email-layout';
import type { QuoteForEmail } from './quotes';

/** The merchant's "new quote request" email. */
export function quoteEmail(quote: QuoteForEmail, quoteUrl: string) {
  const contact = [quote.name, quote.email, quote.phone].filter(Boolean).join(' · ');
  return {
    subject: `New quote request: ${quote.productName} (${quote.price})`,
    ...renderEmail({
      preheader: `${quote.name} wants a quote for ${quote.productName}.`,
      heading: `New quote request for ${quote.productName}`,
      paragraphs: [contact, ...(quote.message ? [`“${quote.message}”`] : [])],
      highlight: quote.price,
      rows: quote.lines.map((l) => [l.label, l.value] as [string, string]),
      button: { label: 'Open the quote', url: quoteUrl },
      note: 'Reply to this email to answer the customer directly.',
    }),
  };
}
