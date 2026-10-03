'use client';

import { useActionState } from 'react';

import { type ContactState, sendContactMessage } from './actions';
import { CONTACT_TOPICS } from './topics';

const initial: ContactState = {};
const field =
  'w-full rounded-lg border border-line bg-surface px-3.5 text-[15px] text-ink outline-none placeholder:text-ink-faint focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20';

export function ContactForm({ name, email }: { name: string; email: string }) {
  const [state, action, pending] = useActionState(sendContactMessage, initial);
  if (state.ok) {
    return (
      <div
        role="status"
        className="rounded-xl bg-emerald-50 p-6 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-100"
      >
        <p className="text-[17px] font-semibold">Message sent</p>
        <p className="mt-1 text-[15px]">Thanks for getting in touch. We’ll reply by email soon.</p>
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
        <label htmlFor="topic" className="text-[14px] font-medium text-ink">
          What’s it about?
        </label>
        <select id="topic" name="topic" defaultValue="Sales" className={`${field} h-11`}>
          {CONTACT_TOPICS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="message" className="text-[14px] font-medium text-ink">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          minLength={10}
          maxLength={4000}
          rows={6}
          className={`${field} py-2.5 leading-relaxed`}
        />
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
        className="h-12 w-full rounded-lg bg-brand-600 px-8 text-[16px] font-semibold text-white hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-60 sm:w-auto"
      >
        {pending ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
