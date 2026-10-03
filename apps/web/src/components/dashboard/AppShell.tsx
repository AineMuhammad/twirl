'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type ReactNode, useState } from 'react';

import { Logo } from '@/components/brand/Logo';

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

function Icon({ d }: { d: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}

const NAV = [
  {
    href: '/dashboard',
    label: 'Products',
    icon: 'M3 7l9-4 9 4-9 4-9-4zm0 0v10l9 4m0-10v10m9-14v10l-9 4',
    exact: true,
  },
  {
    href: '/dashboard/models',
    label: '3D models',
    icon: 'M12 3v12m0 0-4-4m4 4 4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2',
  },
  { href: '/dashboard/quotes', label: 'Quotes', icon: 'M4 6h16v12H4zM4 7l8 6 8-6' },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-2-1.2L14.5 3h-5l-.4 2.6a7.5 7.5 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 2 1.2l.4 2.6h5l.4-2.6a7.5 7.5 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z',
  },
] as const;

export interface AppShellProps {
  children: ReactNode;
  workspaceName: string;
  user: { email: string; name: string | null; isAdmin: boolean };
  newQuotes: number;
  plan: { label: string; used: number; limit: number };
  signOut: () => Promise<void>;
}

/**
 * The signed-in app frame: a left sidebar on desktop (navigation, plan, account) and a top bar
 * with a slide-in menu on phones.
 */
export function AppShell({
  children,
  workspaceName,
  user,
  newQuotes,
  plan,
  signOut,
}: AppShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  // Close the phone menu when the page changes (adjusting state during render).
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMenuOpen(false);
  }

  const active = (href: string, exact = false) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const usage = Math.min(100, (plan.used / Math.max(1, plan.limit)) * 100);
  const initial = (user.name ?? user.email).trim().slice(0, 1).toUpperCase();

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-5 pb-4">
        <Link href="/dashboard" className={`rounded-md ${focusRing}`} aria-label="Dashboard home">
          <Logo size="sm" />
        </Link>
        <p className="mt-3 truncate text-[13px] text-ink-muted" title={workspaceName}>
          {workspaceName}
        </p>
      </div>
      <nav aria-label="Dashboard" className="flex-1 space-y-0.5 px-3">
        {NAV.map((item) => {
          const isActive = active(item.href, 'exact' in item && item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex h-10 items-center gap-3 rounded-lg px-3 text-[14px] font-medium transition-colors ${isActive ? 'bg-tint-strong text-ink' : 'text-ink-soft hover:bg-tint hover:text-ink'} ${focusRing}`}
            >
              <Icon d={item.icon} />
              <span className="flex-1">{item.label}</span>
              {item.href === '/dashboard/quotes' && newQuotes > 0 && (
                <span className="rounded-full bg-brand-600 px-1.5 text-[12px] font-semibold text-white tabular-nums">
                  {newQuotes}
                  <span className="sr-only"> new</span>
                </span>
              )}
            </Link>
          );
        })}
        {user.isAdmin && (
          <Link
            href="/admin"
            className={`mt-2 flex h-10 items-center gap-3 rounded-lg px-3 text-[14px] font-medium text-brand-700 hover:bg-brand-50 dark:text-brand-200 dark:hover:bg-brand-500/15 ${focusRing}`}
          >
            <Icon d="M12 3l8 4v5c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V7l8-4z" />
            Admin panel
          </Link>
        )}
      </nav>
      <div className="space-y-3 p-3">
        <div className="rounded-lg bg-tint p-3.5">
          <div className="flex items-baseline justify-between text-[13px]">
            <span className="font-semibold text-ink">{plan.label} plan</span>
            <span className="text-ink-muted tabular-nums">
              {plan.used}/{plan.limit} live
            </span>
          </div>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-tint-strong"
            role="progressbar"
            aria-label="Live products used"
            aria-valuemin={0}
            aria-valuemax={plan.limit}
            aria-valuenow={plan.used}
          >
            <div
              className={`h-full rounded-full ${usage >= 100 ? 'bg-amber-500' : 'bg-brand-600'}`}
              style={{ width: `${usage}%` }}
            />
          </div>
          <Link
            href="/pricing"
            className="mt-2 inline-block text-[13px] font-medium text-brand-700 hover:underline dark:text-brand-200"
          >
            See plans
          </Link>
        </div>
        <div className="flex items-center gap-2.5 px-1">
          <span
            aria-hidden
            className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-[13px] font-semibold text-surface"
          >
            {initial}
          </span>
          <span className="min-w-0 flex-1 truncate text-[13px] text-ink-soft" title={user.email}>
            {user.email}
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className={`rounded-md px-2 py-1 text-[13px] font-medium text-ink-muted hover:bg-tint hover:text-ink ${focusRing}`}
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-background text-[15px] text-ink">
      {/* Desktop sidebar */}
      <aside
        aria-label="App"
        className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-surface lg:block"
      >
        {sidebar}
      </aside>

      {/* Phone top bar and menu */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface px-4 lg:hidden">
        <Link href="/dashboard" aria-label="Dashboard home" className={`rounded-md ${focusRing}`}>
          <Logo size="sm" />
        </Link>
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="app-menu"
          onClick={() => setMenuOpen((v) => !v)}
          className={`flex h-9 items-center gap-2 rounded-lg border border-line px-3 text-[14px] font-medium ${focusRing}`}
        >
          Menu
          {newQuotes > 0 && <span aria-hidden className="size-2 rounded-full bg-brand-600" />}
        </button>
      </header>
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-black/30"
          />
          <div
            id="app-menu"
            className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-surface shadow-xl"
          >
            {sidebar}
          </div>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-5 py-8 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
