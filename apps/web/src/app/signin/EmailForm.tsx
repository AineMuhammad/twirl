'use client';

import { useActionState } from 'react';

import { type EmailSignInState, signInWithEmail } from './actions';

const initial: EmailSignInState = {};

export function EmailForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, action, pending] = useActionState(signInWithEmail, initial);
  return (
    <form action={action} className="space-y-3" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <label htmlFor="email" className="block text-[15px] font-medium text-ink">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="you@company.com"
        aria-invalid={state.error ? true : undefined}
        aria-describedby={state.error ? 'email-error' : undefined}
        className="h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-[15px] text-ink outline-none placeholder:text-ink-faint focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
      />
      {state.error && (
        <p id="email-error" className="text-[15px] text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-xl bg-brand-600 px-4 text-[15px] font-medium text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-60"
      >
        {pending ? 'Sending link…' : 'Email me a sign-in link'}
      </button>
    </form>
  );
}
