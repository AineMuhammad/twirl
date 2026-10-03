'use client';

import { useActionState } from 'react';

import { requestUpgrade, type UpgradeState } from './actions';

const initial: UpgradeState = {};

export function UpgradeButton({ plan, email }: { plan: 'STARTER' | 'PRO'; email: string }) {
  const [state, action, pending] = useActionState(requestUpgrade, initial);
  if (state.ok) {
    return (
      <p
        role="status"
        className="rounded-xl bg-emerald-50 px-4 py-3 text-[14px] text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200"
      >
        Thanks! We&apos;ll email you at {email} shortly.
      </p>
    );
  }
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="plan" value={plan} />
      <button
        type="submit"
        disabled={pending}
        className="h-11 w-full rounded-xl bg-brand-600 text-[15px] font-semibold text-white hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-60"
      >
        {pending ? 'Sending…' : 'Upgrade — contact us'}
      </button>
      {state.error && (
        <p role="alert" className="text-[13px] text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
    </form>
  );
}
