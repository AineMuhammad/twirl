'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/** Two-step delete (no browser confirm dialog): "Delete" → "Confirm". */
export function DeleteModelButton({ id, filename }: { id: string; filename: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setPending(true);
    setError(null);
    const response = await fetch(`/api/assets/${id}`, { method: 'DELETE' });
    setPending(false);
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? 'Could not delete this model.');
      setConfirming(false);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {error && <span className="text-[13px] text-red-600 dark:text-red-400">{error}</span>}
      {confirming ? (
        <>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="inline-flex h-9 items-center rounded-lg border border-line px-3 text-[14px] font-medium text-ink-soft hover:bg-tint"
          >
            Keep it
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => void remove()}
            aria-label={`Confirm delete ${filename}`}
            className="inline-flex h-9 items-center rounded-lg bg-red-600 px-3 text-[14px] font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {pending ? 'Deleting…' : 'Yes, delete'}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label={`Delete ${filename}`}
          className="inline-flex h-9 items-center rounded-lg px-3 text-[14px] font-medium text-ink-soft hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
        >
          Delete model
        </button>
      )}
    </div>
  );
}
