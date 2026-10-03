'use client';

import { useState } from 'react';

import { XIcon } from './icons';
import { Badge, Button, focusRing } from './ui';

export interface VersionSummary {
  id: string;
  number: number;
  publishedAt: string;
  live: boolean;
}

export interface VersionsDrawerProps {
  versions: VersionSummary[];
  dirty: boolean;
  busy: boolean;
  onClose: () => void;
  onUnpublish: () => void;
  onMakeLive: (versionId: string) => void;
  onCopyToDraft: (versionId: string) => void;
}

const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' });

/**
 * Published versions, newest first. Published versions never change: roll back by making an older
 * one live, or start editing from it by copying it into the draft.
 */
export function VersionsDrawer({
  versions,
  dirty,
  busy,
  onClose,
  onUnpublish,
  onMakeLive,
  onCopyToDraft,
}: VersionsDrawerProps) {
  const [confirm, setConfirm] = useState<string | null>(null);
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="versions-title"
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col bg-surface shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line p-6">
          <div>
            <h2 id="versions-title" className="text-lg font-semibold text-ink">
              Published versions
            </h2>
            <p className="mt-1 text-[14px] text-ink-muted">Shoppers see the version marked Live.</p>
          </div>
          <button
            type="button"
            aria-label="Close versions"
            onClick={onClose}
            className={`grid size-9 shrink-0 place-items-center rounded-lg text-ink-muted hover:bg-tint hover:text-ink ${focusRing}`}
          >
            <XIcon />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {versions.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-[14px] text-ink-muted">
              Nothing published yet. Use <strong className="text-ink">Publish</strong> when your
              product is ready for shoppers.
            </p>
          ) : (
            <ul className="space-y-3">
              {versions.map((v) => (
                <li
                  key={v.id}
                  className={`rounded-2xl p-4 ring-1 ${v.live ? 'bg-emerald-50/50 ring-emerald-200 dark:bg-emerald-500/5 dark:ring-emerald-500/30' : 'bg-surface ring-line'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[15px] font-semibold text-ink">Version {v.number}</p>
                    {v.live && <Badge tone="emerald">Live</Badge>}
                  </div>
                  <p className="mt-0.5 text-[13px] text-ink-muted">
                    Published {dateFormat.format(new Date(v.publishedAt))}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {confirm === v.id ? (
                      <>
                        <span className="w-full text-[13px] text-ink-soft">
                          {v.live
                            ? 'Take this product off your store? You can publish it again any time.'
                            : 'Replace your draft with this version? Unsaved changes will be lost.'}
                        </span>
                        <Button size="sm" variant="ghost" onClick={() => setConfirm(null)}>
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          variant={v.live ? 'danger' : 'primary'}
                          disabled={busy}
                          onClick={() => {
                            setConfirm(null);
                            if (v.live) onUnpublish();
                            else onCopyToDraft(v.id);
                          }}
                        >
                          {v.live ? 'Yes, unpublish' : 'Yes, replace draft'}
                        </Button>
                      </>
                    ) : v.live ? (
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={busy}
                        onClick={() => setConfirm(v.id)}
                      >
                        Unpublish
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          disabled={busy}
                          title="Shoppers will see this version again"
                          onClick={() => onMakeLive(v.id)}
                        >
                          Make live
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          title="Start editing from this version"
                          onClick={() => (dirty ? setConfirm(v.id) : onCopyToDraft(v.id))}
                        >
                          Copy to draft
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
