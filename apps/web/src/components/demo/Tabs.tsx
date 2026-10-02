'use client';

import { type KeyboardEvent, type ReactNode, useId, useRef } from 'react';

export interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

/** WAI-ARIA tabs: arrow keys, Home and End move between tabs; Tab moves into the panel. */
export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}) {
  const baseId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const last = tabs.length - 1;
    const next =
      event.key === 'ArrowRight'
        ? index === last
          ? 0
          : index + 1
        : event.key === 'ArrowLeft'
          ? index === 0
            ? last
            : index - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    const tab = tabs[next];
    if (!tab) return;
    onChange(tab.id);
    refs.current[next]?.focus();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div role="tablist" className="flex shrink-0 gap-1 border-b border-neutral-200 px-3">
        {tabs.map((tab, i) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-blue-600 ${selected ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-800'}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${baseId}-panel-${tab.id}`}
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={tab.id !== active}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
