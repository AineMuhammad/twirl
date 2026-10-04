import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';

import { CountUp } from '@/components/marketing/CountUp';
import { Magnetic } from '@/components/marketing/Magnetic';
import { Reveal } from '@/components/marketing/Reveal';
import { ScrollProgressBar } from '@/components/marketing/ScrollProgressBar';
import { SiteFooter } from '@/components/marketing/SiteFooter';
import { SiteHeader } from '@/components/marketing/SiteHeader';
import { Story } from '@/components/marketing/story/Story';

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';
const primaryButton = `inline-flex h-12 items-center rounded-lg bg-brand-600 px-6 text-[16px] font-medium text-white shadow-sm hover:bg-brand-700 ${focusRing}`;
const container = 'mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12';
const sectionTitle = 'font-display text-[36px] leading-[1.05] tracking-tight sm:text-[48px]';

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
          className="font-medium text-brand-700 underline-offset-4 hover:underline dark:text-brand-200"
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
          className="font-medium text-brand-700 underline-offset-4 hover:underline dark:text-brand-200"
        >
          See all plans
        </Link>
        .
      </>
    ),
  },
];

const card = 'rounded-2xl bg-surface ring-1 ring-line';
const delay = (ms: number) => ({ '--delay': `${ms}ms` }) as CSSProperties;

/* ---- Insight ------------------------------------------------------------------------------- */

function InsightCard() {
  const stats = [
    { label: 'Visitors', value: 1284 },
    { label: 'Designs shared', value: 212 },
    { label: 'Quote requests', value: 37 },
  ];
  return (
    <div className={`${card} p-6`}>
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[15px] font-semibold text-ink">Halo Lounge Chair</p>
        <p className="text-[13px] text-ink-muted">Example · last 30 days</p>
      </div>
      <dl className="mt-5 grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="text-[13px] text-ink-muted">{s.label}</dt>
            <dd className="mt-1 text-[28px] font-semibold tracking-tight text-ink">
              <CountUp value={s.value} />
            </dd>
          </div>
        ))}
      </dl>
      <svg viewBox="0 0 300 80" className="mt-6 h-24 w-full" aria-hidden preserveAspectRatio="none">
        <defs>
          <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#1f4272" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#1f4272" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0 66 C 30 60, 45 62, 70 52 S 110 50, 130 40 S 170 44, 190 30 S 240 26, 260 16 S 290 12, 300 8 L300 80 L0 80 Z"
          fill="url(#spark-fill)"
        />
        <path
          className="draw-path"
          pathLength={1}
          d="M0 66 C 30 60, 45 62, 70 52 S 110 50, 130 40 S 170 44, 190 30 S 240 26, 260 16 S 290 12, 300 8"
          fill="none"
          stroke="#1f4272"
          strokeWidth="2.5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <p className="mt-3 text-[13px] text-ink-muted">
        Most chosen fabric: <span className="font-medium text-ink">Teal velvet</span>
      </p>
    </div>
  );
}

function QuoteCard() {
  return (
    <div className={`${card} p-5 text-[14px] shadow-[0_24px_50px_-28px_rgba(60,30,10,0.5)]`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-ink">New quote request</p>
          <p className="text-[13px] text-ink-muted">Maya Okafor · maya@studio-ok.com</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[12px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
          $1,008
        </span>
      </div>
      <ul className="mt-3 space-y-1 text-[13px] text-ink-soft">
        <li>Seat fabric: Teal velvet</li>
        <li>Frame finish: Matte black</li>
        <li>Back and lumbar cushions</li>
      </ul>
    </div>
  );
}

/* ---- Feature tiles ------------------------------------------------------------------------- */

function Tile({ title, text, children }: { title: string; text: string; children: ReactNode }) {
  return (
    <article className={`flex h-full flex-col p-7 ${card}`}>
      <h3 className="text-[19px] font-semibold tracking-tight text-ink">{title}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">{text}</p>
      <div className="mt-6 flex flex-1 items-end">{children}</div>
    </article>
  );
}

function RuleCard() {
  return (
    <div className="w-full rounded-lg bg-tint p-4 text-[14px]">
      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[12px] font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
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

function VersionsCard() {
  const versions = [
    { v: 3, note: 'Added Teal velvet', live: true },
    { v: 2, note: 'New cushion prices', live: false },
    { v: 1, note: 'First launch', live: false },
  ];
  return (
    <ol className="w-full space-y-2 text-[14px]">
      {versions.map((item) => (
        <li
          key={item.v}
          className="flex items-center justify-between gap-3 rounded-lg bg-tint px-4 py-2.5"
        >
          <span className="text-ink">
            <span className="font-semibold tabular-nums">v{item.v}</span>
            <span className="text-ink-muted"> · {item.note}</span>
          </span>
          {item.live ? (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[12px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              Live
            </span>
          ) : (
            <span className="text-[13px] font-medium text-ink-muted">Roll back</span>
          )}
        </li>
      ))}
    </ol>
  );
}

function ShareCard() {
  return (
    <div className="w-full space-y-2 text-[14px]">
      <div className="flex items-center gap-2 rounded-lg bg-tint px-4 py-2.5">
        <span className="min-w-0 flex-1 truncate text-ink-muted">…/s/Hq8dKs2m</span>
        <span className="font-medium text-brand-700 dark:text-brand-200">Copy link</span>
      </div>
      <div className="flex items-center gap-2 rounded-lg bg-tint px-4 py-2.5">
        <span className="min-w-0 flex-1 text-ink-muted">halo-chair-teal.png · 2400 px</span>
        <span className="font-medium text-brand-700 dark:text-brand-200">Download</span>
      </div>
    </div>
  );
}

function PhoneCard() {
  return (
    <div className="mx-auto w-40 rounded-[26px] bg-ink p-1.5 shadow-[0_20px_40px_-24px_rgba(0,0,0,0.6)]">
      <div className="overflow-hidden rounded-[20px] bg-[radial-gradient(120%_90%_at_50%_30%,#fffaf3,#e6d6c2)]">
        <div className="grid h-28 place-items-center">
          <span className="size-14 rounded-[40%] bg-[#2f6f6a] shadow-[0_10px_20px_-8px_rgba(0,0,0,0.5)]" />
        </div>
        <div className="space-y-1.5 rounded-t-2xl bg-[#fffdf9] p-3">
          <span className="mx-auto block h-1 w-8 rounded-full bg-[#1c1917]/15" />
          <span className="block text-[10px] font-semibold text-[#1c1917]">Seat fabric</span>
          <span className="flex gap-1">
            {['#5d8b98', '#d8ccb6', '#8fa58a', '#b5532f', '#2f6f6a'].map((c) => (
              <span key={c} className="size-4 rounded-full" style={{ background: c }} />
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---- Page ---------------------------------------------------------------------------------- */

export default function HomePage() {
  return (
    <div className="min-h-dvh overflow-x-clip bg-background text-ink">
      <noscript>
        <style>
          {'[data-reveal]{opacity:1!important;transform:none!important;filter:none!important}'}
        </style>
      </noscript>
      <ScrollProgressBar />
      <SiteHeader wide />

      <main>
        <Story />

        {/* Insight: after the sale is set up, see what shoppers do. */}
        <section aria-labelledby="insight" className="border-t border-line bg-surface">
          <div
            className={`${container} grid items-center gap-14 py-28 lg:grid-cols-[1fr_1.3fr] lg:gap-24`}
          >
            <Reveal>
              <p className="text-[14px] font-medium text-brand-700 dark:text-brand-200">
                05 · Insight
              </p>
              <h2 id="insight" className={`mt-3 ${sectionTitle}`}>
                Then see what shoppers choose
              </h2>
              <p className="mt-5 max-w-md text-[17px] leading-relaxed text-ink-soft">
                Every view, share, download and quote is counted per product, so you know which
                finishes people love before you order stock.
              </p>
            </Reveal>
            <div>
              <Reveal>
                <InsightCard />
              </Reveal>
              <Reveal delay={350} className="mt-4">
                <QuoteCard />
              </Reveal>
            </div>
          </div>
        </section>

        {/* Works on */}
        <section aria-labelledby="works-with" className="border-y border-line py-7">
          <h2 id="works-with" className="sr-only">
            Works on
          </h2>
          <ul className="sr-only">
            {PLATFORMS.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <div
            aria-hidden
            className="marquee-wrap overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]"
          >
            <div className="marquee flex w-max gap-16 pr-16">
              {[...PLATFORMS, ...PLATFORMS, ...PLATFORMS, ...PLATFORMS].map((p, i) => (
                <span
                  key={i}
                  className="flex items-center gap-16 font-display text-[26px] whitespace-nowrap text-ink-soft"
                >
                  {p}
                  <span className="size-1.5 rounded-full bg-brand-600" />
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Everything around it */}
        <section aria-labelledby="features" className={`${container} py-28`}>
          <Reveal className="max-w-2xl">
            <h2 id="features" className={sectionTitle}>
              And everything around it
            </h2>
            <p className="mt-4 text-[17px] text-ink-soft">
              The details that turn a pretty 3D model into orders you can actually build.
            </p>
          </Reveal>
          <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <Reveal delay={0}>
              <Tile
                title="Only buildable orders"
                text="Rules stop combinations you don’t sell, and tell shoppers why."
              >
                <RuleCard />
              </Tile>
            </Reveal>
            <Reveal delay={120}>
              <Tile
                title="Publish without fear"
                text="Customers only see changes when you publish. Every version is kept, so you can roll back in a click."
              >
                <VersionsCard />
              </Tile>
            </Reveal>
            <Reveal delay={0}>
              <Tile
                title="Designs that travel"
                text="Shoppers share a link to their exact design or download a sharp image to show the family."
              >
                <ShareCard />
              </Tile>
            </Reveal>
            <Reveal delay={120}>
              <Tile
                title="Made for thumbs too"
                text="On phones, customers turn the product with a finger and pick options from a bottom panel."
              >
                <PhoneCard />
              </Tile>
            </Reveal>
          </div>
        </section>

        {/* How it works */}
        <section aria-labelledby="how" className="border-t border-line bg-surface">
          <div className={`${container} py-28`}>
            <Reveal>
              <h2 id="how" className={sectionTitle}>
                Live in an afternoon
              </h2>
            </Reveal>
            <ol className="mt-14 grid gap-10 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <Reveal as="li" key={step.title} delay={i * 180}>
                  <span
                    aria-hidden
                    className="draw-line block h-0.5 bg-ink"
                    style={delay(i * 180)}
                  />
                  <p className="mt-5 font-display text-[34px] leading-none text-brand-700 tabular-nums dark:text-brand-200">
                    0{i + 1}
                  </p>
                  <p className="mt-3 text-[19px] font-semibold tracking-tight">{step.title}</p>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-muted">{step.text}</p>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* FAQ */}
        <section
          aria-labelledby="faq"
          className={`${container} grid gap-10 py-28 lg:grid-cols-[1fr_1.6fr] lg:gap-24`}
        >
          <Reveal>
            <h2 id="faq" className={sectionTitle}>
              Questions, answered
            </h2>
          </Reveal>
          <Reveal delay={150} className="divide-y divide-line border-y border-line">
            {FAQ.map((item) => (
              <details key={item.q} className="faq group py-5">
                <summary
                  className={`flex cursor-pointer list-none items-center justify-between gap-4 rounded-md text-[17px] font-medium text-ink ${focusRing}`}
                >
                  {item.q}
                  <span
                    aria-hidden
                    className="grid size-8 shrink-0 place-items-center rounded-full text-[20px] leading-none text-ink-muted ring-1 ring-line transition-transform duration-300 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
                  {item.a}
                </p>
              </details>
            ))}
          </Reveal>
        </section>

        {/* Closing call to action */}
        <section className="relative isolate overflow-hidden bg-[#1c1917] text-[#f5f0e8]">
          <div
            aria-hidden
            className="glow absolute -top-1/3 -left-1/4 -z-10 size-[70vmax] rounded-full bg-[radial-gradient(closest-side,rgba(70,110,180,0.42),transparent)]"
          />
          <div
            aria-hidden
            className="glow absolute -right-1/4 -bottom-1/2 -z-10 size-[60vmax] rounded-full bg-[radial-gradient(closest-side,rgba(232,170,110,0.22),transparent)] [animation-delay:-7s]"
          />
          <div className={`${container} py-32 text-center`}>
            <Reveal>
              <h2 className="mx-auto max-w-4xl font-display text-[40px] leading-[1.02] tracking-tight sm:text-[64px]">
                Show customers exactly what they’re buying
              </h2>
            </Reveal>
            <Reveal delay={200}>
              <p className="mx-auto mt-6 max-w-xl text-[17px] text-[#d6cfc4]">
                Set up your first product today. It’s free for one product, and there’s no card to
                enter.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <Magnetic>
                  <Link href="/dashboard" className={primaryButton}>
                    Start free
                  </Link>
                </Magnetic>
                <Magnetic>
                  <Link
                    href="/demo"
                    className={`inline-flex h-12 items-center rounded-lg border border-[#f5f0e8]/25 px-6 text-[16px] font-medium text-[#f5f0e8] hover:bg-[#f5f0e8]/10 ${focusRing}`}
                  >
                    See the demo
                  </Link>
                </Magnetic>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter wide />
    </div>
  );
}
