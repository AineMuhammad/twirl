import type { Metadata } from 'next';
import Link from 'next/link';

import { SiteFooter } from '@/components/marketing/SiteFooter';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { getCurrentUser } from '@/server/auth/session';

import { ContactForm } from './ContactForm';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the Twirl team.',
};

export default async function ContactPage() {
  const user = await getCurrentUser();
  return (
    <div className="min-h-dvh bg-background text-ink">
      <SiteHeader signedIn={Boolean(user)} />
      <main className="mx-auto grid max-w-6xl gap-12 px-5 pt-14 pb-24 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <h1 className="font-display text-[40px] leading-[1.03] tracking-tight sm:text-[48px]">
            Get in touch
          </h1>
          <p className="mt-5 text-[17px] leading-relaxed text-ink-soft">
            Questions about Twirl, help with your configurator, or a product you’d like to try it
            with. We reply to every message, usually within one working day.
          </p>
          <ul className="mt-8 space-y-4 text-[15px]">
            <li>
              <p className="font-medium text-ink">Need a 3D model made?</p>
              <Link
                href="/request-model"
                className="text-brand-700 underline-offset-4 hover:underline"
              >
                Tell us about your product
              </Link>
            </li>
            <li>
              <p className="font-medium text-ink">Want to see it first?</p>
              <Link href="/demo" className="text-brand-700 underline-offset-4 hover:underline">
                Try the live demo
              </Link>
            </li>
          </ul>
        </div>
        <div className="rounded-xl bg-surface p-6 ring-1 ring-line sm:p-8">
          <ContactForm name={user?.name ?? ''} email={user?.email ?? ''} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
