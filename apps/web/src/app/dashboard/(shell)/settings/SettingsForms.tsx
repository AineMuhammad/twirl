'use client';

import { useActionState, useState } from 'react';

import { deleteWorkspaceAction, renameWorkspaceAction, type SettingsState } from './actions';

const initial: SettingsState = {};
const field =
  'h-10 w-full rounded-lg border border-line bg-surface px-3 text-[15px] text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20';

export function RenameWorkspaceForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState(renameWorkspaceAction, initial);
  return (
    <form action={action} className="space-y-3">
      <label htmlFor="workspace-name" className="text-[14px] font-medium text-ink">
        Workspace name
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="workspace-name"
          name="name"
          defaultValue={name}
          maxLength={80}
          required
          className={`${field} max-w-sm`}
        />
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded-lg bg-ink px-4 text-[14px] font-medium text-surface hover:opacity-90 disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
      </div>
      <p role="status" className="min-h-5 text-[13px]">
        {state.ok && <span className="text-emerald-700 dark:text-emerald-300">Saved.</span>}
        {state.error && <span className="text-red-600 dark:text-red-400">{state.error}</span>}
      </p>
    </form>
  );
}

export function DeleteWorkspaceForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState(deleteWorkspaceAction, initial);
  const [typed, setTyped] = useState('');
  return (
    <form action={action} className="space-y-3">
      <label htmlFor="confirm-delete" className="block text-[14px] text-ink-soft">
        Type <strong className="font-semibold text-ink">{name}</strong> to confirm.
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="confirm-delete"
          name="confirm"
          autoComplete="off"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          className={`${field} max-w-sm`}
        />
        <button
          type="submit"
          disabled={pending || typed.trim() !== name}
          className="h-10 rounded-lg bg-red-600 px-4 text-[14px] font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {pending ? 'Deleting…' : 'Delete workspace'}
        </button>
      </div>
      {state.error && (
        <p role="alert" className="text-[13px] text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
    </form>
  );
}
