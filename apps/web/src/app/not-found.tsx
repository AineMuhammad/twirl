import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-tint px-6 text-center text-ink">
      <div>
        <p className="text-[14px] font-semibold tracking-wide text-brand-700 uppercase">404</p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-tight">Page not found</h1>
        <p className="mt-2 text-[16px] text-ink-muted">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-brand-600 px-5 text-[15px] font-medium text-white hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
