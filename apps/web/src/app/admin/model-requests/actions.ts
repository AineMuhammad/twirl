'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { ModelRequestStatus } from '@/generated/prisma/enums';
import { requireAdmin } from '@/server/auth/session';
import { db } from '@/server/db';
import { setModelRequestStatus } from '@/server/model-requests';

const schema = z.object({ id: z.string().min(1).max(64), status: z.enum(ModelRequestStatus) });

export async function setModelRequestStatusAction(formData: FormData) {
  await requireAdmin();
  const parsed = schema.safeParse({ id: formData.get('id'), status: formData.get('status') });
  if (!parsed.success) return;
  await setModelRequestStatus(db(), parsed.data.id, parsed.data.status);
  revalidatePath('/admin/model-requests');
}
