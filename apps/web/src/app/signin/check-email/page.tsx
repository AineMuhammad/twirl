import type { Metadata } from 'next';
import Link from 'next/link';

import { APP_NAME } from '@/config/app';

export const metadata: Metadata = { title: `Check your email · ${APP_NAME}` };

export default function CheckEmailPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-tint px-4 py-12">
      <div className="w-full max-w-sm rounded-3xl bg-surface p-8 text-center shadow-[0_24px_64px_-24px_rgba(0,0,0,0.25)] ring-1 ring-line">
        <h1 className="text-xl font-semibold tracking-tight text-ink">Check your email</h1>
        <p className="mt-2 text-sm text-ink-muted">
          We sent you a sign-in link. It works once and expires in 24 hours.
        </p>
        <Link
          href="/signin"
          className="mt-6 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          Use a different email
        </Link>
      </div>
    </main>
  );
}
