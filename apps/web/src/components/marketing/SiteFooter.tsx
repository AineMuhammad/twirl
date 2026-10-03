import Link from 'next/link';

import { Logo } from '@/components/brand/Logo';
import { APP_NAME } from '@/config/app';

const COLUMNS: { title: string; links: [string, string][] }[] = [
  {
    title: 'Product',
    links: [
      ['Demo', '/demo'],
      ['Pricing', '/pricing'],
      ['Get a 3D model made', '/request-model'],
    ],
  },
  {
    title: 'Company',
    links: [
      ['About', '/about'],
      ['Contact', '/contact'],
    ],
  },
  {
    title: 'Account',
    links: [
      ['Sign in', '/dashboard'],
      ['Start free', '/dashboard'],
    ],
  },
];

/** The public site's footer. */
export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo size="sm" />
          <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-ink-muted">
            3D product configurators for makers of furniture, lighting and other configurable
            products.
          </p>
        </div>
        {COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="text-[13px] font-semibold tracking-wide text-ink uppercase">
              {column.title}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {column.links.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-[14px] text-ink-muted hover:text-ink">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-5 py-6 text-[13px] text-ink-muted">
          © {new Date().getFullYear()} {APP_NAME}. Made for product makers.
        </p>
      </div>
    </footer>
  );
}
