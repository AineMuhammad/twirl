'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { requireWorkspace } from '@/server/auth/session';
import { db } from '@/server/db';
import type { ProductConfig } from '@twirl/config-schema';

import { createProduct, type SaveResult, saveDraft, validateConfig } from '@/server/products';
import {
  copyToDraft,
  makeLive,
  publishDraft,
  unpublish,
  type VersionResult,
} from '@/server/versions';

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

export async function publishAction(productId: string, config: unknown): Promise<VersionResult> {
  const { user, workspace } = await requireWorkspace();
  const parsedId = id.safeParse(productId);
  if (!parsedId.success) return { ok: false, error: 'This product no longer exists.' };
  const result = await publishDraft(db(), workspace.id, user.id, parsedId.data, config);
  if (result.ok) revalidatePath('/dashboard');
  return result;
}

export async function unpublishAction(productId: string) {
  const { workspace } = await requireWorkspace();
  const parsedId = id.safeParse(productId);
  if (!parsedId.success) return { ok: false, error: 'This product no longer exists.' };
  const result = await unpublish(db(), workspace.id, parsedId.data);
  revalidatePath('/dashboard');
  return result;
}

export async function makeLiveAction(productId: string, versionId: string): Promise<VersionResult> {
  const { workspace } = await requireWorkspace();
  const ids = z.tuple([id, id]).safeParse([productId, versionId]);
  if (!ids.success) return { ok: false, error: 'That version no longer exists.' };
  const result = await makeLive(db(), workspace.id, ...ids.data);
  revalidatePath('/dashboard');
  return result;
}

/** Copies a published version into the draft and returns it, parsed, for the editor. */
export async function copyToDraftAction(
  productId: string,
  versionId: string,
): Promise<{ ok: true; config: ProductConfig } | { ok: false; error: string }> {
  const { workspace } = await requireWorkspace();
  const ids = z.tuple([id, id]).safeParse([productId, versionId]);
  if (!ids.success) return { ok: false, error: 'That version no longer exists.' };
  const result = await copyToDraft(db(), workspace.id, ...ids.data);
  if (!result.ok) return result;
  const parsed = validateConfig(result.config);
  if (!parsed.ok) return { ok: false, error: 'That version can no longer be opened.' };
  return { ok: true, config: parsed.config };
}
