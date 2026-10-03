'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { requireWorkspace } from '@/server/auth/session';
import { db } from '@/server/db';
import { setQuoteStatus } from '@/server/quotes';

const input = z.object({ id: z.string().min(1).max(64), status: z.enum(['READ', 'ARCHIVED']) });

/** Archives a quote, or moves it back to the inbox (as read). */
export async function setQuoteStatusAction(formData: FormData) {
  const { workspace } = await requireWorkspace();
  const parsed = input.safeParse({ id: formData.get('id'), status: formData.get('status') });
  if (!parsed.success) return;
  await setQuoteStatus(db(), workspace.id, parsed.data.id, parsed.data.status);
  revalidatePath('/dashboard/quotes');
  revalidatePath(`/dashboard/quotes/${parsed.data.id}`);
}
