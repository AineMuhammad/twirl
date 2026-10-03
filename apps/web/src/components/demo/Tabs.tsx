'use client';

import { type KeyboardEvent, type ReactNode, useId, useRef } from 'react';

import { focusRing } from './ui';

export interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

/**
 * Segmented-control tabs (WAI-ARIA tabs pattern): arrow keys, Home and End move between tabs;
 * Tab moves into the panel.
 */
export function Tabs({
  tabs,
  active,
  onChange,
  header,
}: {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  /** Rendered above the tab bar, inside the same fixed header. */
  header?: ReactNode;
}) {
  const baseId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const last = tabs.length - 1;
    const keys: Record<string, number> = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    };
    const next = keys[event.key];
    const tab = next === undefined ? undefined : tabs[next];
    if (next === undefined || !tab) return;
    event.preventDefault();
    onChange(tab.id);
    refs.current[next]?.focus();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 space-y-3 px-5 pt-2 pb-3 lg:space-y-4 lg:pt-5 lg:pb-4">
        {header}
        <div role="tablist" className="grid grid-flow-col gap-1 rounded-full bg-tint-strong p-1">
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
                className={`rounded-full px-3 py-2 text-sm font-medium transition-all duration-200 ${focusRing} ${selected ? 'bg-surface text-ink shadow-[0_1px_3px_rgba(0,0,0,0.12)] dark:bg-white/12' : 'text-ink-muted hover:text-ink'}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${baseId}-panel-${tab.id}`}
          aria-labelledby={`${baseId}-tab-${tab.id}`}
          hidden={tab.id !== active}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
