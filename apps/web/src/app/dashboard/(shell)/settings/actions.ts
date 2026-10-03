'use server';

import { revalidatePath } from 'next/cache';

import { signOut } from '@/auth';
import { requireWorkspace } from '@/server/auth/session';
import { db } from '@/server/db';
import { deleteObject, storageEnabled } from '@/server/storage/r2';
import { deleteWorkspace, renameWorkspace } from '@/server/workspace-settings';

export type SettingsState = { ok?: boolean; error?: string };

export async function renameWorkspaceAction(
  _state: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { workspace } = await requireWorkspace('/dashboard/settings');
  const name = String(formData.get('name') ?? '');
  if (!(await renameWorkspace(db(), workspace.id, name))) {
    return { error: 'Use between 1 and 80 characters.' };
  }
  revalidatePath('/dashboard', 'layout');
  return { ok: true };
}

export async function deleteWorkspaceAction(
  _state: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { workspace } = await requireWorkspace('/dashboard/settings');
  if (String(formData.get('confirm') ?? '').trim() !== workspace.name) {
    return { error: 'Type the workspace name exactly to confirm.' };
  }
  await deleteWorkspace(db(), workspace.id, (key) =>
    storageEnabled ? deleteObject(key) : Promise.resolve(),
  );
  await signOut({ redirectTo: '/' });
  return { ok: true };
}
