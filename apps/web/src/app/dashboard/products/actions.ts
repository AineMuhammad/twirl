'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { requireWorkspace } from '@/server/auth/session';
import { db } from '@/server/db';
import { createProduct, type SaveResult, saveDraft } from '@/server/products';

const id = z.string().min(1).max(64);

export async function createProductAction(input: {
  assetId: string;
  config: unknown;
}): Promise<{ error: string }> {
  const { user, workspace } = await requireWorkspace();
  const assetId = id.safeParse(input.assetId);
  if (!assetId.success) return { error: 'That model is not available.' };
  const result = await createProduct(db(), workspace.id, user.id, {
    assetId: assetId.data,
    config: input.config,
  });
  if (!result.ok) return { error: result.error };
  redirect(`/dashboard/products/${result.productId}`);
}

export async function saveDraftAction(productId: string, config: unknown): Promise<SaveResult> {
  const { workspace } = await requireWorkspace();
  const parsedId = id.safeParse(productId);
  if (!parsedId.success) return { ok: false, error: 'This product no longer exists.' };
  const result = await saveDraft(db(), workspace.id, parsedId.data, config);
  if (result.ok) revalidatePath('/dashboard');
  return result;
}
