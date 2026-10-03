import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const { quoteEmail } = await import('./quote-email');

describe('quoteEmail', () => {
  it('includes the design and escapes shopper input in HTML', () => {
    const email = quoteEmail(
      {
        id: 'q1',
        workspaceId: 'w1',
        productName: 'Halo Chair',
        name: 'Ada <script>',
        email: 'ada@example.com',
        phone: null,
        message: 'Hi & thanks',
        price: '$1,008.00',
        lines: [{ label: 'Seat fabric', value: 'Teal velvet' }],
      },
      'https://twirl.example/dashboard/quotes/q1',
    );
    expect(email.subject).toBe('New quote request: Halo Chair ($1,008.00)');
    expect(email.text).toContain('Seat fabric: Teal velvet');
    expect(email.html).toContain('Ada &lt;script&gt;');
    expect(email.html).not.toContain('<script>');
    expect(email.html).toContain('Hi &amp; thanks');
  });
});
