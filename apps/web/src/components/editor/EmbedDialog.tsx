'use client';

import { useState } from 'react';

import { clientEnv } from '@/env/client';
import { embedSnippet } from '@/lib/embed-protocol';

import { XIcon } from './icons';
import { Button, focusRing } from './ui';

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 2000);
    } catch {
      setCopied(null);
    }
  };
  return { copied, copy };
}

/** The code to paste into a website, plus a direct link to the configurator. */
export function EmbedDialog({ publicId, onClose }: { publicId: string; onClose: () => void }) {
  const appUrl = clientEnv.NEXT_PUBLIC_APP_URL ?? window.location.origin;
  const snippet = embedSnippet(appUrl, publicId);
  const link = `${appUrl.replace(/\/+$/, '')}/embed/${publicId}`;
  const { copied, copy } = useCopy();

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/30 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="embed-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl bg-surface shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line p-6">
          <div>
            <h2 id="embed-title" className="text-lg font-semibold text-ink">
              Add to your website
            </h2>
            <p className="mt-1 text-[14px] text-ink-muted">
              Paste this code where the configurator should appear.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className={`grid size-9 shrink-0 place-items-center rounded-lg text-ink-muted hover:bg-tint hover:text-ink ${focusRing}`}
          >
            <XIcon />
          </button>
        </header>
        <div className="space-y-6 p-6">
          <div>
            <pre className="overflow-x-auto rounded-xl bg-tint p-4 font-mono text-[13px] leading-relaxed text-ink">
              {snippet}
            </pre>
            <div className="mt-3 flex justify-end">
              <Button variant="primary" onClick={() => void copy('snippet', snippet)}>
                {copied === 'snippet' ? 'Copied' : 'Copy code'}
              </Button>
            </div>
          </div>
          <div>
            <p className="text-[14px] font-medium text-ink">Direct link</p>
            <div className="mt-2 flex items-center gap-2">
              <input
                readOnly
                aria-label="Direct link"
                value={link}
                onFocus={(e) => e.target.select()}
                className="h-10 w-full min-w-0 rounded-lg border border-line bg-tint px-3 font-mono text-[13px] text-ink"
              />
              <Button onClick={() => void copy('link', link)}>
                {copied === 'link' ? 'Copied' : 'Copy'}
              </Button>
              <a
                href={link}
                target="_blank"
                rel="noopener"
                className={`inline-flex h-10 shrink-0 items-center rounded-lg px-3 text-[14px] font-medium text-brand-700 hover:bg-brand-50 dark:text-brand-200 dark:hover:bg-brand-500/15 ${focusRing}`}
              >
                Open
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
