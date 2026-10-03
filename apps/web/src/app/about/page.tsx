import type { Metadata } from 'next';
import Link from 'next/link';

import { SiteFooter } from '@/components/marketing/SiteFooter';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { getCurrentUser } from '@/server/auth/session';

export const metadata: Metadata = {
  title: 'About',
  description: 'Why we built Twirl, and who it’s for.',
};

const PRINCIPLES = [
  {
    title: 'Show the real thing',
    text: 'Customers should see the exact product they’re ordering, in their colours and size, not a stock photo and a list of options.',
  },
  {
    title: 'Only promise what you can build',
    text: 'Rules and server-side pricing mean every quote describes something you actually make, at the price you set.',
  },
  {
    title: 'Respect the shopper',
    text: 'No accounts, no tracking cookies, no personal data unless they choose to ask for a quote.',
  },
];

export default async function AboutPage() {
  const user = await getCurrentUser();
  return (
    <div className="min-h-dvh bg-background text-ink">
      <SiteHeader signedIn={Boolean(user)} />
      <main>
        <section className="mx-auto max-w-3xl px-5 pt-14 pb-16">
          <p className="text-[14px] font-medium text-brand-700">About Twirl</p>
          <h1 className="mt-4 font-display text-[48px] leading-[1.03] tracking-tight sm:text-[60px]">
            Configurable products deserve better than a dropdown
          </h1>
          <div className="mt-8 space-y-5 text-[17px] leading-relaxed text-ink-soft">
            <p>
              Makers of furniture, lighting and other configurable products offer dozens of fabrics,
              finishes and sizes. Online, that usually becomes a long form, a few photos and a lot
              of emails to work out what the customer actually wants.
            </p>
            <p>
              Twirl replaces that with the product itself. You upload the 3D model you already use
              for manufacturing or marketing, choose what customers can change, and put a
              configurator on your site in an afternoon. Customers see every choice on the real
              product with a live price, and when they ask for a quote, you get their exact design.
            </p>
            <p>
              We focus on the parts that matter to a small team: setting it up without developers,
              keeping prices and combinations correct, and sending you leads you can act on straight
              away.
            </p>
          </div>
        </section>

        <section aria-labelledby="principles" className="border-t border-line bg-surface">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h2 id="principles" className="font-display text-[40px] leading-[1.05] tracking-tight">
              What we care about
            </h2>
            <ul className="mt-10 grid gap-10 md:grid-cols-3">
              {PRINCIPLES.map((p) => (
                <li key={p.title} className="border-t-2 border-ink pt-5">
                  <p className="text-[19px] font-semibold tracking-tight">{p.title}</p>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">{p.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-20 text-center">
          <h2 className="font-display text-[36px] leading-tight tracking-tight">Talk to us</h2>
          <p className="mt-3 text-[17px] text-ink-soft">
            Questions, a product you’d like to try it with, or a model you need made?
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex h-12 items-center rounded-lg bg-brand-600 px-6 text-[16px] font-medium text-white shadow-sm hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              Contact us
            </Link>
            <Link
              href="/demo"
              className="inline-flex h-12 items-center rounded-lg border border-line bg-surface px-6 text-[16px] font-medium text-ink hover:bg-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              Try the demo
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
