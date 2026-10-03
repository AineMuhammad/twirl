import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { APP_NAME } from '@/config/app';
import { requireWorkspace } from '@/server/auth/session';

import { signOutAction } from './actions';

export const metadata: Metadata = { title: `Dashboard · ${APP_NAME}` };

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, workspace } = await requireWorkspace();
  return (
    <div className="min-h-dvh bg-tint">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/dashboard" className="font-display text-2xl tracking-tight text-ink">
              {APP_NAME}
              <span className="text-brand-600 italic">.</span>
            </Link>
            <span className="truncate text-sm text-ink-muted">{workspace.name}</span>
          </div>
          <div className="flex items-center gap-3">
            {user.isAdmin && (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
                Admin
              </span>
            )}
            <span className="hidden truncate text-sm text-ink-soft sm:inline">{user.email}</span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-10">{children}</main>
    </div>
  );
}
