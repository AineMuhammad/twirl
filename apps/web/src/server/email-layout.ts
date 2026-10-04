import { APP_NAME } from '@/config/app';

/**
 * Twirl's email design: warm sand background, a white card, the wordmark, one clear button.
 * Built from tables and inline styles so it renders the same in Gmail, Outlook and Apple Mail.
 * Every value is escaped here, so callers can pass raw text.
 */

export interface EmailContent {
  /** Hidden preview line shown next to the subject in inbox lists. */
  preheader: string;
  heading: string;
  paragraphs?: string[];
  /** Label/value rows, e.g. a customer's choices. */
  rows?: [string, string][];
  /** A highlighted line above the rows, e.g. a price. */
  highlight?: string;
  button?: { label: string; url: string };
  /** Small print under the button. */
  note?: string;
}

const C = {
  sand: '#f5f0e8',
  card: '#fffdf9',
  ink: '#1c1917',
  soft: '#44403c',
  muted: '#57534e',
  line: '#e7e0d5',
  accent: '#1f4272',
};

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderEmail(content: EmailContent): { html: string; text: string } {
  const e = escapeHtml;
  const paragraphs = (content.paragraphs ?? [])
    .map(
      (p) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${C.soft};white-space:pre-wrap">${e(p)}</p>`,
    )
    .join('');
  const highlight = content.highlight
    ? `<p style="margin:4px 0 14px;font-size:22px;font-weight:600;color:${C.ink}">${e(content.highlight)}</p>`
    : '';
  const rows = content.rows?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 20px">${content.rows
        .map(
          ([label, value]) =>
            `<tr><td style="padding:8px 12px 8px 0;border-top:1px solid ${C.line};font-size:14px;color:${C.muted};vertical-align:top">${e(label)}</td><td style="padding:8px 0;border-top:1px solid ${C.line};font-size:14px;color:${C.ink};text-align:right;vertical-align:top">${e(value)}</td></tr>`,
        )
        .join('')}</table>`
    : '';
  const button = content.button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 18px"><tr><td style="border-radius:8px;background:${C.accent}"><a href="${e(content.button.url)}" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px">${e(content.button.label)}</a></td></tr></table>`
    : '';
  const note = content.note
    ? `<p style="margin:0;font-size:13px;line-height:1.5;color:${C.muted}">${e(content.note)}</p>`
    : '';

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${e(content.heading)}</title></head>
<body style="margin:0;padding:0;background:${C.sand};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${e(content.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.sand}"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="padding:0 4px 18px"><span style="display:inline-block;width:10px;height:10px;border-radius:5px;background:${C.accent};margin-right:8px;vertical-align:middle"></span><span style="font-family:Georgia,'Times New Roman',serif;font-size:24px;color:${C.ink};vertical-align:middle">${e(APP_NAME.toLowerCase())}</span></td></tr>
<tr><td style="background:${C.card};border:1px solid ${C.line};border-radius:12px;padding:32px 28px">
<h1 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;line-height:1.25;color:${C.ink}">${e(content.heading)}</h1>
${paragraphs}${highlight}${rows}${button}${note}
</td></tr>
<tr><td style="padding:18px 4px 0;font-size:12px;line-height:1.5;color:${C.muted}">${e(APP_NAME)}: 3D product configurators for product makers.</td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    content.heading,
    '',
    ...(content.paragraphs ?? []),
    ...(content.highlight ? ['', content.highlight] : []),
    ...(content.rows?.length ? ['', ...content.rows.map(([l, v]) => `${l}: ${v}`)] : []),
    ...(content.button ? ['', `${content.button.label}: ${content.button.url}`] : []),
    ...(content.note ? ['', content.note] : []),
    '',
    `${APP_NAME}: 3D product configurators for product makers.`,
  ].join('\n');

  return { html, text };
}
