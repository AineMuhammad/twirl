import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { APP_NAME } from '@/config/app';
import { requireAdmin } from '@/server/auth/session';

export const metadata: Metadata = { title: `Admin · ${APP_NAME}`, robots: { index: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();
  return (
    <div className="min-h-dvh bg-tint">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="font-display text-2xl tracking-tight text-ink">
              {APP_NAME}
              <span className="text-brand-600 italic">.</span>
            </Link>
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-ink-muted sm:inline">{user.email}</span>
            <Link href="/dashboard" className="font-medium text-ink-soft hover:text-ink">
              Dashboard
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10">{children}</main>
    </div>
  );
}
