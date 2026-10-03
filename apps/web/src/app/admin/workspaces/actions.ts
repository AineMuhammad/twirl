'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { Plan } from '@/generated/prisma/enums';
import { requireAdmin } from '@/server/auth/session';
import { db } from '@/server/db';

const schema = z.object({
  workspaceId: z.string().min(1).max(64),
  plan: z.enum(Plan),
});

export type SetPlanState = { ok?: boolean; error?: string };

/** Admin-only: set a workspace's plan by hand (no billing in v1). */
export async function setWorkspacePlan(
  _state: SetPlanState,
  formData: FormData,
): Promise<SetPlanState> {
  const admin = await requireAdmin();
  const parsed = schema.safeParse({
    workspaceId: formData.get('workspaceId'),
    plan: formData.get('plan'),
  });
  if (!parsed.success) return { error: 'Choose a valid plan.' };
  const updated = await db().workspace.updateMany({
    where: { id: parsed.data.workspaceId },
    data: { plan: parsed.data.plan, planSetById: admin.id, planSetAt: new Date() },
  });
  if (updated.count === 0) return { error: 'Workspace not found.' };
  revalidatePath('/admin', 'layout');
  return { ok: true };
}
