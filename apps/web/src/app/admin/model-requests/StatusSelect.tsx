'use client';

import { useRef } from 'react';

import type { ModelRequestStatus } from '@/generated/prisma/enums';

import { setModelRequestStatusAction } from './actions';

const LABELS: Record<ModelRequestStatus, string> = {
  NEW: 'New',
  IN_PROGRESS: 'In progress',
  DONE: 'Done',
  DECLINED: 'Declined',
};

/** Saves as soon as a new status is picked. */
export function StatusSelect({
  id,
  status,
  name,
}: {
  id: string;
  status: ModelRequestStatus;
  name: string;
}) {
  const form = useRef<HTMLFormElement>(null);
  return (
    <form ref={form} action={setModelRequestStatusAction}>
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={status}
        aria-label={`Status of ${name}'s request`}
        onChange={() => form.current?.requestSubmit()}
        className="h-9 rounded-lg border border-line bg-surface px-2.5 text-[14px] text-ink focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
      >
        {(Object.keys(LABELS) as ModelRequestStatus[]).map((s) => (
          <option key={s} value={s}>
            {LABELS[s]}
          </option>
        ))}
      </select>
    </form>
  );
}
