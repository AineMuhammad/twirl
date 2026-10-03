import Link from 'next/link';
import type { ReactNode } from 'react';

import { Logo } from '@/components/brand/Logo';
import { HeroScene } from '@/components/marketing/HeroScene';

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';
const primaryButton = `inline-flex h-12 items-center rounded-lg bg-brand-600 px-6 text-[16px] font-medium text-white shadow-sm hover:bg-brand-700 ${focusRing}`;
const secondaryButton = `inline-flex h-12 items-center rounded-lg border border-line bg-surface px-6 text-[16px] font-medium text-ink hover:bg-tint ${focusRing}`;

const PLATFORMS = ['Shopify', 'WordPress', 'Webflow', 'Squarespace', 'Wix', 'Any HTML site'];

const STEPS = [
  {
    title: 'Upload your 3D model',
    text: 'A .glb or .gltf of your product. We check it straight away and flag anything that needs fixing.',
  },
  {
    title: 'Choose what customers can change',
    text: 'Name the parts, add colours and add-ons, set prices and the combinations you don’t sell.',
  },
  {
    title: 'Paste two lines on your site',
    text: 'The configurator appears on your product page. Quotes land in your inbox with the full spec.',
  },
];

const FAQ: { q: string; a: ReactNode }[] = [
  {
    q: 'Do I need a 3D model of my product?',
    a: (
      <>
        Yes, a .glb or .gltf file, ideally split into the parts customers can change. Don’t have
        one?{' '}
        <Link
          href="/request-model"
          className="font-medium text-brand-700 underline-offset-4 hover:underline"
        >
          We can make it for you
        </Link>
        .
      </>
    ),
  },
  {
    q: 'Will it slow down my website?',
    a: 'No. The configurator loads in its own frame, only when it scrolls into view, and adapts its quality to the device.',
  },
  {
    q: 'Does it work on phones?',
    a: 'Yes. Customers rotate the product with a finger, and the options open in a panel at the bottom of the screen.',
  },
  {
    q: 'How do quotes work?',
    a: 'Customers fill in a short form. You get an email with their exact choices and a price we work out on our servers, so it can’t be tampered with. Every quote is also kept in your dashboard.',
  },
  {
    q: 'Can I change a product after it’s live?',
    a: 'Edit as much as you like; customers only see changes when you publish. Every published version is kept, so you can roll back in a click.',
  },
  {
    q: 'Is there a free plan?',
    a: (
      <>
        Yes. One live product, free, with a small “Made with Twirl” mark.{' '}
        <Link
          href="/pricing"
          className="font-medium text-brand-700 underline-offset-4 hover:underline"
        >
          See all plans
        </Link>
        .
      </>
    ),
  },
];

/** A feature tile: copy on top, a small slice of the real product UI underneath. */
function Feature({
  title,
  text,
  children,
  className = '',
}: {
  title: string;
  text: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article className={`flex flex-col rounded-xl bg-surface p-7 ring-1 ring-line ${className}`}>
      <h3 className="text-[19px] font-semibold tracking-tight text-ink">{title}</h3>
      <p className="mt-2 max-w-md text-[15px] leading-relaxed text-ink-muted">{text}</p>
      <div className="mt-6 flex flex-1 items-end">{children}</div>
    </article>
  );
}

function Swatches() {
  const colours = [
    ['Lagoon weave', null],
    ['Oat linen', '#d8ccb6'],
    ['Sage', '#8fa58a'],
    ['Terracotta', '#b5532f'],
    ['Teal velvet', '#2f6f6a'],
    ['Ink velvet', '#232b4a'],
  ] as const;
  return (
    <div className="w-full rounded-lg bg-tint p-4">
      <p className="text-[13px] font-medium text-ink">Seat fabric</p>
      <p className="text-[13px] text-ink-muted">Teal velvet · +$60.00</p>
      <div className="mt-3 flex flex-wrap gap-2.5">
        {colours.map(([name, hex]) => (
          <span
            key={name}
            title={name}
            className={`size-9 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] ${name === 'Teal velvet' ? 'ring-2 ring-brand-600 ring-offset-2 ring-offset-tint' : ''}`}
            style={{
              background:
                hex ?? 'repeating-conic-gradient(#e5ded3 0 25%, #fffdf9 0 50%) 50% / 8px 8px',
            }}
          />
        ))}
      </div>
    </div>
  );
}

function PriceCard() {
  const lines = [
    ['Halo Lounge Chair', '$899.00'],
    ['Seat fabric: Teal velvet', '+$60.00'],
    ['Diamond cushion', '+$49.00'],
    ['Diameter: 130 cm', '+$80.00'],
  ];
  return (
    <dl className="w-full rounded-lg bg-tint p-4 text-[14px]">
      {lines.map(([label, amount]) => (
        <div key={label} className="flex justify-between gap-4 py-1">
          <dt className="text-ink-muted">{label}</dt>
          <dd className="text-ink tabular-nums">{amount}</dd>
        </div>
      ))}
      <div className="mt-2 flex justify-between gap-4 border-t border-line pt-2 text-[16px] font-semibold">
        <dt className="text-ink">Total</dt>
        <dd className="text-ink tabular-nums">$1,088.00</dd>
      </div>
    </dl>
  );
}

function RuleCard() {
  return (
    <div className="w-full rounded-lg bg-tint p-4 text-[14px]">
      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[12px] font-medium text-brand-700">
        Requires
      </span>
      <p className="mt-2 text-ink">
        If <strong className="font-semibold">Diameter</strong> is at least 135 cm, then{' '}
        <strong className="font-semibold">Frame</strong> is Brushed brass.
      </p>
      <p className="mt-2 text-[13px] text-ink-muted">
        Shoppers see: “Sizes of 135 cm and up use the reinforced brass frame.”
      </p>
    </div>
  );
}

function EmbedCard() {
  return (
    <pre className="w-full rounded-lg bg-ink p-4 font-mono text-[13px] leading-relaxed break-all whitespace-pre-wrap text-[#e7e0d5]">
      <span className="text-[#d6a58e]">&lt;div</span> data-twirl-product=
      <span className="text-[#a3bfa6]">&quot;Hq8dKs2mPz4A&quot;</span>
      <span className="text-[#d6a58e]">&gt;&lt;/div&gt;</span>
      {'\n'}
      <span className="text-[#d6a58e]">&lt;script</span> src=
      <span className="text-[#a3bfa6]">&quot;…/embed.js&quot;</span> async
      <span className="text-[#d6a58e]">&gt;&lt;/script&gt;</span>
    </pre>
  );
}

function QuoteCard() {
  return (
    <div className="w-full rounded-lg bg-tint p-4 text-[14px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-ink">New quote request</p>
          <p className="text-[13px] text-ink-muted">Maya Okafor · maya@studio-ok.com</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[12px] font-medium text-emerald-700">
          $1,088.00
        </span>
      </div>
      <ul className="mt-3 space-y-1 text-[13px] text-ink-soft">
        <li>Seat fabric: Teal velvet</li>
        <li>Frame finish: Matte black</li>
        <li>Diameter: 130 cm</li>
      </ul>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-background text-ink">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/" className={`rounded-md ${focusRing}`} aria-label="Twirl home">
          <Logo />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/demo"
            className={`hidden h-10 items-center rounded-lg px-3 text-[15px] font-medium text-ink-soft hover:text-ink sm:flex ${focusRing}`}
          >
            Demo
          </Link>
          <Link
            href="/pricing"
            className={`flex h-10 items-center rounded-lg px-3 text-[15px] font-medium text-ink-soft hover:text-ink ${focusRing}`}
          >
            Pricing
          </Link>
          <Link
            href="/dashboard"
            className={`flex h-10 items-center rounded-lg px-3 text-[15px] font-medium text-ink-soft hover:text-ink ${focusRing}`}
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className={`hidden h-10 items-center rounded-lg bg-ink px-4 text-[15px] font-medium text-surface hover:opacity-90 sm:flex ${focusRing}`}
          >
            Start free
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-12 pb-20 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
          <div>
            <p className="text-[14px] font-medium text-brand-700">
              3D configurators for product makers
            </p>
            <h1 className="mt-4 font-display text-[52px] leading-[1.02] tracking-tight sm:text-[68px]">
              Let customers design it before they buy it
            </h1>
            <p className="mt-6 max-w-xl text-[18px] leading-relaxed text-ink-soft">
              Twirl turns your product’s 3D model into a configurator for your website: colours,
              add-ons, sizes and a live price. Quotes arrive with the exact spec attached.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/dashboard" className={primaryButton}>
                Start free
              </Link>
              <Link href="/demo" className={secondaryButton}>
                Try the demo
              </Link>
            </div>
            <p className="mt-4 text-[14px] text-ink-muted">Free for one product. No card needed.</p>
          </div>
          <HeroScene />
        </section>

        {/* Works with */}
        <section aria-labelledby="works-with" className="border-y border-line bg-surface">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-10 gap-y-3 px-5 py-6">
            <h2 id="works-with" className="text-[14px] text-ink-muted">
              Works on
            </h2>
            <ul className="flex flex-wrap gap-x-8 gap-y-2">
              {PLATFORMS.map((p) => (
                <li key={p} className="text-[16px] font-semibold tracking-tight text-ink-soft">
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Features */}
        <section aria-labelledby="features" className="mx-auto max-w-6xl px-5 py-24">
          <div className="max-w-2xl">
            <h2
              id="features"
              className="font-display text-[42px] leading-[1.05] tracking-tight sm:text-[52px]"
            >
              Everything a configurable product needs
            </h2>
            <p className="mt-4 text-[17px] text-ink-soft">
              Set it up once in the editor. Customers get a configurator that feels like part of
              your brand, and you get orders that can actually be built.
            </p>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-6">
            <Feature
              className="lg:col-span-4"
              title="Every finish, rendered in 3D"
              text="Customers pick colours per part and see them on the product instantly, with the fabric weave and wood grain kept intact."
            >
              <Swatches />
            </Feature>
            <Feature
              className="lg:col-span-2"
              title="Prices that add up"
              text="Each choice adds its own cost. The total updates as they go."
            >
              <PriceCard />
            </Feature>
            <Feature
              className="lg:col-span-2"
              title="Only buildable orders"
              text="Rules stop combinations you don’t sell, and explain why."
            >
              <RuleCard />
            </Feature>
            <Feature
              className="lg:col-span-2"
              title="Quotes with the full spec"
              text="No more back-and-forth emails to work out what they want."
            >
              <QuoteCard />
            </Feature>
            <Feature
              className="lg:col-span-2"
              title="Two lines on any site"
              text="Paste the snippet where the configurator should go."
            >
              <EmbedCard />
            </Feature>
          </div>
        </section>

        {/* How it works */}
        <section aria-labelledby="how" className="border-t border-line bg-surface">
          <div className="mx-auto max-w-6xl px-5 py-24">
            <h2
              id="how"
              className="font-display text-[42px] leading-[1.05] tracking-tight sm:text-[52px]"
            >
              Live in an afternoon
            </h2>
            <ol className="mt-12 grid gap-10 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="border-t-2 border-ink pt-5">
                  <p className="text-[14px] font-medium text-brand-700 tabular-nums">0{i + 1}</p>
                  <p className="mt-2 text-[19px] font-semibold tracking-tight">{step.title}</p>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* FAQ */}
        <section
          aria-labelledby="faq"
          className="mx-auto grid max-w-6xl gap-10 px-5 py-24 lg:grid-cols-[1fr_1.6fr]"
        >
          <h2
            id="faq"
            className="font-display text-[42px] leading-[1.05] tracking-tight sm:text-[52px]"
          >
            Questions, answered
          </h2>
          <div className="divide-y divide-line border-y border-line">
            {FAQ.map((item) => (
              <details key={item.q} className="group py-5">
                <summary
                  className={`flex cursor-pointer list-none items-center justify-between gap-4 rounded-md text-[17px] font-medium text-ink ${focusRing}`}
                >
                  {item.q}
                  <span
                    aria-hidden
                    className="text-[22px] leading-none text-ink-muted transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Closing call to action */}
        <section className="bg-ink text-surface">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-5 py-20 md:flex-row md:items-center">
            <h2 className="max-w-2xl font-display text-[40px] leading-[1.05] tracking-tight sm:text-[50px]">
              Show customers exactly what they’re buying
            </h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard" className={primaryButton}>
                Start free
              </Link>
              <Link
                href="/demo"
                className={`inline-flex h-12 items-center rounded-lg border border-surface/25 px-6 text-[16px] font-medium text-surface hover:bg-surface/10 ${focusRing}`}
              >
                See the demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-10 text-[14px] text-ink-muted">
        <Logo size="sm" />
        <nav aria-label="Footer" className="flex flex-wrap gap-6">
          <Link href="/demo" className="hover:text-ink">
            Demo
          </Link>
          <Link href="/pricing" className="hover:text-ink">
            Pricing
          </Link>
          <Link href="/request-model" className="hover:text-ink">
            Get a 3D model made
          </Link>
          <Link href="/dashboard" className="hover:text-ink">
            Sign in
          </Link>
        </nav>
      </footer>
    </div>
  );
}
