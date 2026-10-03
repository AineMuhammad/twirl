import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { authEnabled, emailEnabled, googleEnabled } from '@/auth';
import { getCurrentUser } from '@/server/auth/session';
import { safeReturnPath, signInErrorMessage } from '@/server/auth/redirect';

import { signInWithGoogle } from './actions';
import { EmailForm } from './EmailForm';
import { Logo } from '@/components/brand/Logo';

export const metadata: Metadata = { title: 'Sign in' };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = safeReturnPath(params.callbackUrl);
  if (await getCurrentUser()) redirect(callbackUrl);
  const error = signInErrorMessage(params.error);

  return (
    <main className="grid min-h-dvh place-items-center bg-tint px-4 py-12">
      <div className="w-full max-w-md rounded-xl bg-surface p-8 shadow-[0_24px_64px_-24px_rgba(0,0,0,0.25)] ring-1 ring-line">
        <Link href="/" className="font-display text-3xl tracking-tight text-ink">
          <Logo />
        </Link>
        <h1 className="mt-6 text-xl font-semibold tracking-tight text-ink">Sign in</h1>
        <p className="mt-1 text-[15px] text-ink-muted">
          New here? Signing in creates your workspace.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 px-3.5 py-2.5 text-[15px] text-red-700 ring-1 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30"
          >
            {error}
          </p>
        )}

        {!authEnabled ? (
          <p className="mt-6 text-[15px] text-ink-muted">
            Sign-in isn&apos;t configured on this server.
          </p>
        ) : (
          <div className="mt-6 space-y-5">
            {googleEnabled && (
              <form action={signInWithGoogle}>
                <input type="hidden" name="callbackUrl" value={callbackUrl} />
                <button
                  type="submit"
                  className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-line bg-surface px-4 text-[15px] font-medium text-ink transition-colors hover:bg-tint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                >
                  <GoogleMark />
                  Continue with Google
                </button>
              </form>
            )}
            {googleEnabled && emailEnabled && (
              <div className="flex items-center gap-3 text-[13px] text-ink-faint" aria-hidden>
                <span className="h-px flex-1 bg-line" />
                or
                <span className="h-px flex-1 bg-line" />
              </div>
            )}
            {emailEnabled && <EmailForm callbackUrl={callbackUrl} />}
          </div>
        )}
      </div>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
