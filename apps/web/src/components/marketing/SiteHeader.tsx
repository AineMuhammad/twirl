import Link from 'next/link';

import { Logo } from '@/components/brand/Logo';

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';
const navLink = `flex h-10 items-center rounded-lg px-3 text-[15px] font-medium text-ink-soft hover:text-ink ${focusRing}`;

/** The public site's header (home, pricing, about, contact…). */
export function SiteHeader({ signedIn = false }: { signedIn?: boolean }) {
  return (
    <header className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
      <Link href="/" className={`rounded-md ${focusRing}`} aria-label="Twirl home">
        <Logo />
      </Link>
      <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
        <Link href="/demo" className={`hidden sm:flex ${navLink}`}>
          Demo
        </Link>
        <Link href="/pricing" className={navLink}>
          Pricing
        </Link>
        {signedIn ? (
          <Link
            href="/dashboard"
            className={`flex h-10 items-center rounded-lg bg-ink px-4 text-[15px] font-medium text-surface hover:opacity-90 ${focusRing}`}
          >
            Dashboard
          </Link>
        ) : (
          <>
            <Link href="/dashboard" className={navLink}>
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className={`hidden h-10 items-center rounded-lg bg-ink px-4 text-[15px] font-medium text-surface hover:opacity-90 sm:flex ${focusRing}`}
            >
              Start free
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
