import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { requireAdmin } from '@/server/auth/session';
import { Logo } from '@/components/brand/Logo';

export const metadata: Metadata = { title: 'Admin', robots: { index: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();
  return (
    <div className="min-h-dvh bg-tint">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="font-display text-2xl tracking-tight text-ink">
              <Logo />
            </Link>
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[13px] font-medium text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
              Admin
            </span>
          </div>
          <nav aria-label="Admin" className="flex items-center gap-1">
            <Link
              href="/admin"
              className="flex h-9 items-center rounded-lg px-3 text-[14px] font-medium text-ink-soft hover:bg-tint hover:text-ink"
            >
              Overview
            </Link>
            <Link
              href="/admin/workspaces"
              className="flex h-9 items-center rounded-lg px-3 text-[14px] font-medium text-ink-soft hover:bg-tint hover:text-ink"
            >
              Workspaces
            </Link>
            <Link
              href="/admin/model-requests"
              className="flex h-9 items-center rounded-lg px-3 text-[14px] font-medium text-ink-soft hover:bg-tint hover:text-ink"
            >
              Model requests
            </Link>
          </nav>
          <div className="flex items-center gap-4 text-[14px]">
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
