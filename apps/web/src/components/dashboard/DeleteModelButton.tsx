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
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
      {confirming ? (
        <>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-lg px-2.5 py-1 text-xs font-medium text-ink-soft hover:bg-tint"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => void remove()}
            aria-label={`Confirm delete ${filename}`}
            className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {pending ? 'Deleting…' : 'Confirm'}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label={`Delete ${filename}`}
          className="rounded-lg px-2.5 py-1 text-xs font-medium text-ink-soft hover:bg-tint hover:text-red-600"
        >
          Delete
        </button>
      )}
    </div>
  );
}
