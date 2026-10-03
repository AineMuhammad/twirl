import type { Metadata } from 'next';
import Link from 'next/link';

import { getCurrentUser } from '@/server/auth/session';

import { RequestModelForm } from './RequestModelForm';
import { Logo } from '@/components/brand/Logo';

export const metadata: Metadata = {
  title: 'Get a 3D model made',
  description: 'Don’t have a 3D model of your product? We can make one for you.',
};

export default async function RequestModelPage() {
  const user = await getCurrentUser();
  return (
    <div className="min-h-dvh bg-tint text-ink">
      <header className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">
        <Link href="/" className="rounded-md font-display text-[28px] leading-none tracking-tight">
          <Logo />
        </Link>
        <Link
          href={user ? '/dashboard' : '/pricing'}
          className="text-[15px] font-medium text-ink-soft hover:text-ink"
        >
          {user ? 'Dashboard' : 'Pricing'}
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-5 pt-10 pb-24">
        <h1 className="font-display text-[44px] leading-none tracking-tight sm:text-[52px]">
          Need a 3D model?
        </h1>
        <p className="mt-3 max-w-2xl text-[17px] text-ink-soft">
          Tell us about your product and we&apos;ll make a model that&apos;s ready to customise.
          We&apos;ll reply with a quote first.
        </p>
        <div className="mt-10 rounded-xl bg-surface p-6 ring-1 ring-line sm:p-8">
          <RequestModelForm name={user?.name ?? ''} email={user?.email ?? ''} />
        </div>
      </main>
    </div>
  );
}
