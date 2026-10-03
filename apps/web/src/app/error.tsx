'use client';

import { useEffect } from 'react';

/** Shown when a page fails to render. Details stay in the server logs. */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app] page error', error.digest ?? error.message);
  }, [error]);
  return (
    <main className="grid min-h-dvh place-items-center bg-tint px-6 text-center text-ink">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight">Something went wrong</h1>
        <p className="mt-2 text-[16px] text-ink-muted">
          Please try again. If it keeps happening, contact support.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-brand-600 px-5 text-[15px] font-medium text-white hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
