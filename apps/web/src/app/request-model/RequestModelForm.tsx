'use client';

import { useActionState } from 'react';

import { type ModelRequestState, submitModelRequest } from './actions';

const initial: ModelRequestState = {};
const field =
  'w-full rounded-xl border border-line bg-surface px-3.5 text-[15px] text-ink outline-none placeholder:text-ink-faint focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20';

export function RequestModelForm({ name, email }: { name: string; email: string }) {
  const [state, action, pending] = useActionState(submitModelRequest, initial);
  if (state.ok) {
    return (
      <div
        role="status"
        className="rounded-xl bg-emerald-50 p-6 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-100"
      >
        <p className="text-[17px] font-semibold">Request sent</p>
        <p className="mt-1 text-[15px]">
          Thanks! We&apos;ll reply by email, usually within two working days.
        </p>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-[14px] font-medium text-ink">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            maxLength={100}
            autoComplete="name"
            defaultValue={name}
            className={`${field} h-11`}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-[14px] font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            defaultValue={email}
            className={`${field} h-11`}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="company" className="text-[14px] font-medium text-ink">
          Company <span className="font-normal text-ink-muted">(optional)</span>
        </label>
        <input
          id="company"
          name="company"
          maxLength={120}
          autoComplete="organization"
          className={`${field} h-11`}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="description" className="text-[14px] font-medium text-ink">
          What do you need?
        </label>
        <textarea
          id="description"
          name="description"
          required
          minLength={10}
          maxLength={3000}
          rows={5}
          placeholder="The product, its size, which parts customers should be able to change…"
          className={`${field} py-2.5 leading-relaxed`}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="links" className="text-[14px] font-medium text-ink">
          Links <span className="font-normal text-ink-muted">(optional)</span>
        </label>
        <textarea
          id="links"
          name="links"
          rows={3}
          maxLength={3000}
          placeholder={'https://yourstore.com/products/chair\nhttps://photos.example.com/chair'}
          className={`${field} py-2.5 font-mono text-[13px] leading-relaxed`}
        />
        <p className="text-[13px] text-ink-muted">
          Product pages, photos or drawings. One per line.
        </p>
      </div>
      {/* Spam trap: invisible to people, filled in by bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {state.error && (
        <p role="alert" className="text-[14px] text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-xl bg-brand-600 text-[16px] font-semibold text-white hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {pending ? 'Sending…' : 'Send request'}
      </button>
    </form>
  );
}
