import type { Metadata } from 'next';

import { getCurrentUser } from '@/server/auth/session';

import { RequestModelForm } from './RequestModelForm';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { SiteHeader } from '@/components/marketing/SiteHeader';

export const metadata: Metadata = {
  title: 'Get a 3D model made',
  description: 'Don’t have a 3D model of your product? We can make one for you.',
};

export default async function RequestModelPage() {
  const user = await getCurrentUser();
  return (
    <div className="min-h-dvh bg-tint text-ink">
      <SiteHeader signedIn={Boolean(user)} />
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
      <SiteFooter />
    </div>
  );
}
