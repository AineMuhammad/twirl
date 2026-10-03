import Link from 'next/link';
import type { ReactNode } from 'react';

import { APP_NAME } from '@/config/app';
import { requireWorkspace } from '@/server/auth/session';

import { signOutAction } from '../actions';

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

/** Dashboard pages with the top bar (the product editor uses the full screen instead). */
export default async function DashboardShellLayout({ children }: { children: ReactNode }) {
  const { user, workspace } = await requireWorkspace();
  const initials = (user.name ?? user.email).trim().slice(0, 1).toUpperCase();
  return (
    <div className="min-h-dvh bg-tint text-[15px]">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <div className="flex min-w-0 items-center gap-4">
            <Link
              href="/dashboard"
              className={`rounded-md font-display text-[28px] leading-none tracking-tight text-ink ${focusRing}`}
            >
              {APP_NAME}
              <span className="text-brand-600 italic">.</span>
            </Link>
            <span className="hidden truncate rounded-full bg-tint-strong px-3 py-1 text-[13px] font-medium text-ink-soft sm:inline">
              {workspace.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {user.isAdmin && (
              <Link
                href="/admin"
                className={`flex h-9 items-center rounded-lg px-3 text-[14px] font-medium text-brand-700 hover:bg-brand-50 dark:text-brand-200 dark:hover:bg-brand-500/15 ${focusRing}`}
              >
                Admin panel
              </Link>
            )}
            <span className="hidden items-center gap-2 pl-1 md:flex" title={user.email}>
              <span
                aria-hidden
                className="grid size-8 place-items-center rounded-full bg-brand-600 text-[13px] font-semibold text-white"
              >
                {initials}
              </span>
              <span className="max-w-48 truncate text-[14px] text-ink-soft">{user.email}</span>
            </span>
            <form action={signOutAction}>
              <button
                type="submit"
                className={`flex h-9 items-center rounded-lg border border-line px-3 text-[14px] font-medium text-ink-soft hover:bg-tint hover:text-ink ${focusRing}`}
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10">{children}</main>
    </div>
  );
}
