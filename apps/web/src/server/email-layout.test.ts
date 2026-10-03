import { describe, expect, it } from 'vitest';

import { renderEmail } from './email-layout';

describe('renderEmail', () => {
  it('renders every part, escaped, in both HTML and text', () => {
    const { html, text } = renderEmail({
      preheader: 'Preview <line>',
      heading: 'Hello & welcome',
      paragraphs: ['Line with <b>tags</b>'],
      highlight: '$1,088.00',
      rows: [['Seat fabric', 'Teal "velvet"']],
      button: { label: 'Open it', url: 'https://twirl.example/q?a=1&b=2' },
      note: 'Small print',
    });
    expect(html).toContain('Hello &amp; welcome');
    expect(html).toContain('Line with &lt;b&gt;tags&lt;/b&gt;');
    expect(html).toContain('Teal &quot;velvet&quot;');
    expect(html).toContain('href="https://twirl.example/q?a=1&amp;b=2"');
    expect(html).not.toContain('<b>tags</b>');
    expect(text).toContain('Seat fabric: Teal "velvet"');
    expect(text).toContain('Open it: https://twirl.example/q?a=1&b=2');
  });

  it('leaves out sections that aren’t given', () => {
    const { html } = renderEmail({ preheader: 'p', heading: 'Just a heading' });
    expect(html).not.toContain(
      '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px',
    );
  });
});
