import Link from 'next/link';

import { APP_DESCRIPTION, APP_NAME } from '@/config/app';

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

const STEPS = [
  { title: 'Upload your model', text: 'Bring the 3D file of your product (.glb or .gltf).' },
  { title: 'Choose what changes', text: 'Pick the parts shoppers can recolour, remove or resize.' },
  { title: 'Share it', text: 'Embed the configurator on your store. Prices update live.' },
];

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-tint text-ink">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <span className="font-display text-[28px] leading-none tracking-tight">
          {APP_NAME}
          <span className="text-brand-600 italic">.</span>
        </span>
        <nav className="flex items-center gap-2">
          <Link
            href="/pricing"
            className={`flex h-10 items-center rounded-lg px-4 text-[15px] font-medium text-ink-soft hover:text-ink ${focusRing}`}
          >
            Pricing
          </Link>
          <Link
            href="/dashboard"
            className={`flex h-10 items-center rounded-lg border border-line bg-surface px-4 text-[15px] font-medium text-ink shadow-sm hover:bg-tint ${focusRing}`}
          >
            Sign in
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-5 pt-16 pb-24 sm:pt-24">
        <section className="max-w-3xl">
          <h1 className="font-display text-[56px] leading-[1.02] tracking-tight sm:text-[76px]">
            Let shoppers design your product in 3D
            <span className="text-brand-600 italic">.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-[19px] leading-relaxed text-ink-soft">
            {APP_DESCRIPTION}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href="/demo"
              className={`inline-flex h-12 items-center rounded-xl bg-brand-600 px-6 text-[16px] font-medium text-white shadow-[0_8px_24px_-8px_var(--color-brand-600)] hover:bg-brand-700 ${focusRing}`}
            >
              Try the demo
            </Link>
            <Link
              href="/dashboard"
              className={`inline-flex h-12 items-center rounded-xl border border-line bg-surface px-6 text-[16px] font-medium text-ink hover:bg-tint ${focusRing}`}
            >
              Create your configurator
            </Link>
          </div>
        </section>

        <section aria-labelledby="how" className="mt-24">
          <h2 id="how" className="text-[13px] font-semibold tracking-wide text-ink-muted uppercase">
            How it works
          </h2>
          <ol className="mt-5 grid gap-4 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="rounded-2xl bg-surface p-6 ring-1 ring-line">
                <span className="grid size-9 place-items-center rounded-full bg-brand-50 text-[15px] font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
                  {i + 1}
                </span>
                <p className="mt-4 text-[17px] font-semibold">{step.title}</p>
                <p className="mt-1 text-[15px] leading-relaxed text-ink-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
