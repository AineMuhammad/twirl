'use client';

import { useActionState } from 'react';

import { PLAN_ORDER, PLANS } from '@/config/plans';
import type { Plan } from '@/generated/prisma/enums';

import { type SetPlanState, setWorkspacePlan } from './actions';

const initial: SetPlanState = {};

export function PlanSelect({
  workspaceId,
  workspaceName,
  plan,
}: {
  workspaceId: string;
  workspaceName: string;
  plan: Plan;
}) {
  const [state, action, pending] = useActionState(setWorkspacePlan, initial);
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <select
        name="plan"
        defaultValue={plan}
        aria-label={`Plan for ${workspaceName}`}
        className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm text-ink focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none"
      >
        {PLAN_ORDER.map((p) => (
          <option key={p} value={p}>
            {PLANS[p].label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-ink px-3 py-1.5 text-sm font-medium text-surface hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Save'}
      </button>
      <span role="status" className="text-xs">
        {state.ok && <span className="text-emerald-600 dark:text-emerald-400">Saved</span>}
        {state.error && <span className="text-red-600 dark:text-red-400">{state.error}</span>}
      </span>
    </form>
  );
}
