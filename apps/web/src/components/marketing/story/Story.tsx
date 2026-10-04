'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Component,
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { CountUp } from '../CountUp';
import { Magnetic } from '../Magnetic';
import { Reveal } from '../Reveal';
import {
  BASE_PRICE,
  CHAPTERS,
  CUSHION_PRICE,
  EMBED_CODE,
  FABRICS,
  fabricIndex,
  PARTS,
  partIndex,
} from './chapters';

const StoryCanvas = dynamic(() => import('./StoryCanvas').then((m) => m.StoryCanvas), {
  ssr: false,
});

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';
const primaryButton = `inline-flex h-12 items-center rounded-lg bg-brand-600 px-6 text-[16px] font-medium text-white shadow-sm hover:bg-brand-700 ${focusRing}`;
const secondaryButton = `inline-flex h-12 items-center rounded-lg border border-line bg-surface px-6 text-[16px] font-medium text-ink hover:bg-tint ${focusRing}`;

const HEADLINE = 'Let customers design it before they buy it';
const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

interface View {
  chapter: number;
  part: number;
  fabric: number;
  typed: number;
  checked: boolean;
  /** Still on the hero: the scroll cue shows. */
  atTop: boolean;
}
const START: View = { chapter: 0, part: -1, fabric: 0, typed: 0, checked: false, atTop: true };
const MAX_SCROLL_LOCK_MS = 9000;

/** If WebGL isn't available the stage keeps its painted backdrop instead of failing the page. */
class SceneBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch() {
    this.props.onError();
  }
  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * The landing page's opening: a pinned 3D chair that tells the product story as you scroll.
 * Each chapter's text scrolls past on the left; the stage on the right follows along.
 */
export function Story() {
  const section = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const [view, setView] = useState<View>(START);
  const [onScreen, setOnScreen] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  // The page holds still while the chair assembles, then invites a scroll.
  const [assembled, setAssembled] = useState(false);
  const onAssembled = useCallback(() => setAssembled(true), []);

  useEffect(() => {
    if (assembled || reducedMotion || window.scrollY > 40) return;
    const root = document.documentElement;
    // Keep the scrollbar's space while it's hidden, so the layout doesn't jump.
    root.style.scrollbarGutter = 'stable';
    root.style.overflow = 'hidden';
    // Never trap the visitor if the model is slow or fails to load.
    const failsafe = setTimeout(onAssembled, MAX_SCROLL_LOCK_MS);
    return () => {
      root.style.overflow = '';
      root.style.scrollbarGutter = '';
      clearTimeout(failsafe);
    };
  }, [assembled, reducedMotion, onAssembled]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  // Story position from where each chapter's text sits relative to the reading line.
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const wide = window.matchMedia('(min-width: 1024px)').matches;
      const focus = window.innerHeight * (wide ? 0.5 : 0.74);
      const centers = [...(section.current?.querySelectorAll('[data-marker]') ?? [])].map((el) => {
        const r = el.getBoundingClientRect();
        return r.top + r.height / 2;
      });
      let t = 0;
      for (let i = centers.length - 1; i >= 0; i--) {
        const here = centers[i] ?? 0;
        if (focus < here) continue;
        const next = centers[i + 1];
        t = next === undefined ? i : i + (focus - here) / (next - here);
        break;
      }
      t = Math.min(t, CHAPTERS.length - 0.5);
      progress.current = t;
      section.current?.style.setProperty('--t', t.toFixed(3));
      const next: View = {
        chapter: Math.min(CHAPTERS.length - 1, Math.round(t)),
        part: partIndex(t),
        fabric: fabricIndex(t),
        typed: Math.round(Math.min(1, Math.max(0, (t - 3.55) / 0.6)) * EMBED_CODE.length),
        checked: t >= 1.05,
        atTop: t < 0.15,
      };
      setView((prev) =>
        (Object.keys(next) as (keyof View)[]).every((k) => prev[k] === next[k]) ? prev : next,
      );
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(frame);
    };
  }, [progress]);

  // Stop rendering 3D once the story has scrolled away.
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(!!entry?.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const fabric = FABRICS[view.fabric] ?? FABRICS[0];
  const total = BASE_PRICE + CUSHION_PRICE + fabric.price;

  return (
    <section
      ref={section}
      aria-label="How Twirl works"
      className="relative flex flex-col px-5 sm:px-8 lg:grid lg:grid-cols-[minmax(400px,36rem)_minmax(0,1fr)] lg:gap-x-12 lg:pr-0 lg:pl-12 xl:pl-16"
      style={{ '--t': 0 } as CSSProperties}
    >
      {/* Chapter 0: the hero */}
      <div
        data-marker=""
        className="order-0 flex flex-col justify-center pt-8 pb-12 lg:col-start-1 lg:row-start-1 lg:min-h-[calc(100svh-4rem)] lg:py-0"
      >
        <p className="word-in text-[14px] font-medium text-brand-700 dark:text-brand-200">
          3D configurators for product makers
        </p>
        <h1 className="mt-4 font-display text-[42px] leading-[1.02] tracking-tight sm:text-[58px] xl:text-[66px]">
          {HEADLINE.split(' ').map((word, i) => (
            <span key={i} className="word-in" style={{ '--i': i + 1 } as CSSProperties}>
              {word}
              {' '}
            </span>
          ))}
        </h1>
        <p
          className="word-in mt-6 max-w-xl text-[18px] leading-relaxed text-ink-soft"
          style={{ '--i': 9 } as CSSProperties}
        >
          Twirl turns your product’s 3D model into a configurator for your website: colours,
          add-ons, sizes and a live price. Quotes arrive with the exact spec attached.
        </p>
        <div className="word-in mt-9" style={{ '--i': 11 } as CSSProperties}>
          <div className="flex flex-wrap items-center gap-3">
            <Magnetic>
              <Link href="/dashboard" className={primaryButton}>
                Start free
              </Link>
            </Magnetic>
            <Magnetic>
              <Link href="/demo" className={secondaryButton}>
                Try the demo
              </Link>
            </Magnetic>
          </div>
        </div>
        <p
          className="word-in mt-4 text-[14px] text-ink-muted"
          style={{ '--i': 12 } as CSSProperties}
        >
          Free for one product. No card needed.
        </p>
      </div>

      {/* The pinned stage */}
      <div className="sticky top-0 z-10 order-1 -mx-5 h-[46svh] bg-background sm:-mx-8 lg:static lg:order-none lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mx-0 lg:h-auto lg:bg-transparent lg:py-0">
        <div className="h-full lg:sticky lg:top-0 lg:h-svh">
          <div
            data-chapter={view.chapter}
            className="story-stage grain relative h-full overflow-hidden lg:rounded-l-[32px]"
          >
            <span className="sr-only">
              A lounge chair in 3D that assembles, shows its parts, changes fabric and lands on a
              shop page as you scroll.
            </span>
            <div aria-hidden className="absolute inset-0">
              <SceneBoundary onError={onAssembled}>
                <StoryCanvas
                  onAssembled={onAssembled}
                  active={onScreen}
                  progress={progress}
                  activePart={view.part}
                  showLabels={view.chapter === 2}
                  reducedMotion={reducedMotion}
                />
              </SceneBoundary>
            </div>

            {/* Colours chapter: the price follows the fabric. */}
            <div
              aria-hidden
              className={`absolute top-4 right-4 rounded-2xl bg-surface/95 px-4 py-3 shadow-[0_12px_30px_-14px_rgba(60,30,10,0.45)] ring-1 ring-line transition-all duration-500 sm:top-6 sm:right-6 ${view.chapter === 3 ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-2 opacity-0'}`}
            >
              <p className="text-[12px] text-ink-muted">Halo Lounge Chair</p>
              <p className="text-[24px] font-semibold tracking-tight text-ink">
                <CountUp value={total} format={money} duration={600} />
              </p>
            </div>

            {/* Embed chapter: the stage becomes a shop's product page. */}
            <div
              aria-hidden
              className={`pointer-events-none absolute inset-3 flex flex-col overflow-hidden rounded-[20px] ring-1 ring-ink/15 transition-all duration-700 ease-out sm:inset-5 ${view.chapter === 4 ? 'visible scale-100 opacity-100' : 'invisible scale-[1.04] opacity-0'}`}
            >
              <div className="flex h-9 shrink-0 items-center gap-1.5 bg-surface/95 px-3 ring-1 ring-line">
                <span className="size-2.5 rounded-full bg-[#e8735a]" />
                <span className="size-2.5 rounded-full bg-[#e8b85a]" />
                <span className="size-2.5 rounded-full bg-[#7cb07a]" />
                <span className="mx-auto truncate rounded-md bg-tint px-3 py-0.5 text-[12px] text-ink-muted">
                  yourstore.com/products/halo-lounge-chair
                </span>
              </div>
              <div className="flex flex-1 justify-end">
                <div className="hidden w-[40%] flex-col justify-center gap-3 bg-surface/95 p-6 sm:flex">
                  <p className="text-[12px] tracking-wide text-ink-muted uppercase">Lounge</p>
                  <p className="font-display text-[26px] leading-none text-ink">
                    Halo Lounge Chair
                  </p>
                  <p className="text-[18px] font-semibold text-ink tabular-nums">{money(total)}</p>
                  <div className="flex gap-1.5">
                    {FABRICS.map((f) => (
                      <span
                        key={f.name}
                        className={`size-5 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)] ${f.name === fabric.name ? 'ring-2 ring-brand-600 ring-offset-1 ring-offset-surface' : ''}`}
                        style={{ background: f.hex ?? '#5d8b98' }}
                      />
                    ))}
                  </div>
                  <span className="mt-2 inline-flex h-10 items-center justify-center rounded-lg bg-ink text-[14px] font-medium text-surface">
                    Request a quote
                  </span>
                  <span className="h-2 w-3/4 rounded-full bg-tint-strong" />
                  <span className="h-2 w-1/2 rounded-full bg-tint-strong" />
                </div>
              </div>
            </div>

            {/* Chapter marker */}
            <div
              aria-hidden
              className={`absolute bottom-4 left-4 flex items-center gap-3 rounded-full bg-surface/90 py-1.5 pr-4 pl-3 text-[13px] shadow-sm ring-1 ring-line transition-opacity duration-500 sm:bottom-6 sm:left-6 ${view.chapter === 4 ? 'opacity-0' : 'opacity-100'}`}
            >
              <span className="flex gap-1">
                {CHAPTERS.map((c, i) => (
                  <span
                    key={c}
                    className={`h-1.5 rounded-full transition-all duration-500 ${i === view.chapter ? 'w-5 bg-brand-600' : 'w-1.5 bg-ink/20'}`}
                  />
                ))}
              </span>
              <span className="font-medium text-ink tabular-nums">0{view.chapter + 1}</span>
              <span className="text-ink-muted">{CHAPTERS[view.chapter]}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chapters 1–4 */}
      <div className="order-2 lg:col-start-1 lg:row-start-2">
        <Chapter index={1} title="Start with the model you already have">
          <p>
            Upload a .glb or .gltf of your product. Twirl checks it straight away, finds its parts
            and flags anything that needs fixing.
          </p>
          <div className="mt-6 rounded-xl bg-surface p-4 ring-1 ring-line">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-brand-50 text-[12px] font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
                GLB
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-ink">halo-lounge-chair.glb</p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-tint-strong">
                  <div
                    className="h-full rounded-full bg-brand-600"
                    style={{ width: 'clamp(0%, calc((var(--t) - 0.35) / 0.7 * 100%), 100%)' }}
                  />
                </div>
              </div>
              <span className="text-[13px] text-ink-muted tabular-nums">4.6 MB</span>
            </div>
            <ul className="mt-4 space-y-1.5 text-[14px]">
              {['4 parts found', 'Textures look good', 'Ready to set up'].map((item, i) => (
                <li
                  key={item}
                  className={`flex items-center gap-2 transition-all duration-500 ${view.checked ? 'text-ink' : 'translate-x-1 text-ink-muted'}`}
                  style={{ transitionDelay: view.checked ? `${i * 150}ms` : '0ms' }}
                >
                  <span
                    aria-hidden
                    className={`grid size-5 place-items-center rounded-full text-[11px] transition-colors duration-500 ${view.checked ? 'bg-emerald-600 text-white' : 'bg-tint-strong text-transparent'}`}
                    style={{ transitionDelay: view.checked ? `${i * 150}ms` : '0ms' }}
                  >
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Chapter>

        <Chapter index={2} title="Choose what shoppers can change">
          <p>
            Pick the parts customers can restyle. Name them the way your customers would, and hide
            the ones that stay as they are.
          </p>
          <ul className="mt-6 space-y-2">
            {PARTS.map((part, i) => (
              <li
                key={part.node}
                className={`flex items-center justify-between rounded-xl px-4 py-3 ring-1 transition-all duration-300 ${i === view.part ? 'bg-surface shadow-[0_8px_20px_-12px_rgba(31,66,114,0.55)] ring-brand-600' : 'bg-surface/60 ring-line'}`}
              >
                <span className="text-[15px] font-medium text-ink">{part.label}</span>
                <span
                  aria-hidden
                  className={`relative h-5 w-9 rounded-full transition-colors duration-300 ${i <= view.part || view.chapter > 2 ? 'bg-brand-600' : 'bg-tint-strong'}`}
                >
                  <span
                    className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-all duration-300 ${i <= view.part || view.chapter > 2 ? 'left-[18px]' : 'left-0.5'}`}
                  />
                </span>
              </li>
            ))}
          </ul>
        </Chapter>

        <Chapter index={3} title="Every finish, with a price that adds up">
          <p>
            Add colours and materials per part. Customers see them on the product instantly, with
            the weave and grain intact, and the total updates as they go.
          </p>
          <div className="mt-6 rounded-xl bg-surface p-4 ring-1 ring-line">
            <p className="text-[14px] font-medium text-ink">Seat fabric</p>
            <p className="text-[13px] text-ink-muted">
              {fabric.name}
              {fabric.price > 0 ? ` · +${money(fabric.price)}` : ' · included'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {FABRICS.map((f) => (
                <span
                  key={f.name}
                  title={f.name}
                  className={`size-9 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] transition-all duration-300 ${f.name === fabric.name ? 'scale-110 ring-2 ring-brand-600 ring-offset-2 ring-offset-surface' : ''}`}
                  style={{
                    background:
                      f.hex ??
                      'repeating-conic-gradient(#5d8b98 0 25%, #8fb3bd 0 50%) 50% / 8px 8px',
                  }}
                />
              ))}
            </div>
            <div className="mt-4 flex items-baseline justify-between border-t border-line pt-3">
              <span className="text-[14px] text-ink-muted">Total</span>
              <span className="text-[20px] font-semibold text-ink">
                <CountUp value={total} format={money} duration={600} />
              </span>
            </div>
          </div>
        </Chapter>

        <Chapter index={4} title="Two lines, on any website">
          <p>
            Paste the snippet where the configurator should go: Shopify, WordPress, Webflow or plain
            HTML. Quotes land in your inbox with the full spec.
          </p>
          <pre className="mt-6 min-h-[92px] rounded-xl bg-[#1c1917] p-4 font-mono text-[13px] leading-relaxed break-all whitespace-pre-wrap text-[#e7e0d5]">
            <span aria-hidden>{EMBED_CODE.slice(0, view.typed)}</span>
            <span
              aria-hidden
              className="ml-px inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-brand-500"
            />
            <span className="sr-only">{EMBED_CODE}</span>
          </pre>
        </Chapter>
        {/* Gives the last chapter room to play out before the page moves on. */}
        <div data-marker="" aria-hidden className="h-[45svh]" />
      </div>
      {/* Once the chair is built: invite the first scroll. */}
      <div
        aria-hidden
        className={`pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center transition-all duration-700 ${assembled && view.atTop ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-3 opacity-0'}`}
      >
        <div className="flex items-center gap-3 rounded-full bg-surface/95 py-2.5 pr-5 pl-4 text-[14px] font-medium text-ink shadow-[0_12px_30px_-12px_rgba(60,30,10,0.45)] ring-1 ring-line">
          <span className="relative h-6 w-1 overflow-hidden rounded-full bg-tint-strong">
            <span className="scroll-cue absolute inset-0 rounded-full bg-brand-600" />
          </span>
          Scroll to see how it works
        </div>
      </div>
    </section>
  );
}

function Chapter({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <article data-marker="" className="min-h-[120svh] lg:min-h-[170svh]">
      <Reveal className="sticky top-[46svh] flex min-h-[54svh] max-w-md flex-col justify-center py-10 lg:top-0 lg:min-h-svh">
        <p className="text-[14px] font-medium text-brand-700 tabular-nums dark:text-brand-200">
          0{index} · {CHAPTERS[index]}
        </p>
        <h2 className="mt-3 font-display text-[34px] leading-[1.04] tracking-tight sm:text-[40px]">
          {title}
        </h2>
        <div className="mt-4 text-[17px] leading-relaxed text-ink-soft">{children}</div>
      </Reveal>
    </article>
  );
}
