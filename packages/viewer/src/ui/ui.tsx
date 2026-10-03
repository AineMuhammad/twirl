'use client';

import type { ReactNode } from 'react';

/** Shared demo UI primitives and class recipes. */

export const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

/** Floating surface over the 3D stage (top bar, view pills, phone sheet): solid, softly raised. */
export const glass = 'bg-surface ring-1 ring-line shadow-[0_8px_24px_-12px_rgba(28,25,23,0.28)]';

/** Rainbow fill for "custom color" swatches. */
export const RAINBOW =
  'conic-gradient(from 90deg, #f43f5e, #f59e0b, #84cc16, #06b6d4, #6366f1, #d946ef, #f43f5e)';

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h3 className="text-[14px] font-semibold text-ink">{children}</h3>
      {hint && <p className="text-[13px] text-ink-muted">{hint}</p>}
    </div>
  );
}

export function Switch({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center justify-between gap-4 rounded-xl px-3 py-3 text-left hover:bg-tint ${focusRing}`}
    >
      <span>
        <span className="block text-[14px] font-medium text-ink">{label}</span>
        {description && <span className="block text-[13px] text-ink-muted">{description}</span>}
      </span>
      <span
        aria-hidden
        className={`relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200 ${checked ? 'bg-brand-600' : 'bg-tint-strong'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-surface shadow-sm transition-transform duration-200 ${checked ? 'translate-x-4' : ''}`}
        />
      </span>
    </button>
  );
}

/** Small round check badge shown on selected swatches and tiles. */
export function CheckBadge({ dark = false }: { dark?: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid size-5 place-items-center rounded-full ${dark ? 'bg-surface text-ink' : 'bg-brand-600 text-white'} shadow-sm`}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  );
}
