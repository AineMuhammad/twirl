'use client';

import type { ReactNode } from 'react';

/** Shared demo UI primitives. */

export const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900';

/** Frosted floating surface used for the top bar and the control panel. */
export const glass =
  'bg-white/80 backdrop-blur-xl ring-1 ring-black/[0.06] shadow-[0_12px_48px_-12px_rgba(0,0,0,0.25)]';

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between gap-3">
      <h3 className="text-[13px] font-semibold text-neutral-900">{children}</h3>
      {hint && <p className="text-xs text-neutral-500">{hint}</p>}
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
      className={`flex w-full items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-left hover:bg-black/[0.03] ${focusRing}`}
    >
      <span>
        <span className="block text-sm font-medium text-neutral-900">{label}</span>
        {description && <span className="block text-xs text-neutral-500">{description}</span>}
      </span>
      <span
        aria-hidden
        className={`relative h-6 w-10 shrink-0 rounded-full transition-colors duration-200 ${checked ? 'bg-neutral-900' : 'bg-neutral-200'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-4' : ''}`}
        />
      </span>
    </button>
  );
}
