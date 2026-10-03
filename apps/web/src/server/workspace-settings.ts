import type { PrismaClient } from '@/generated/prisma/client';

/** Workspace changes made by its owner from Settings. Callers check access first. */

export async function renameWorkspace(db: PrismaClient, workspaceId: string, name: string) {
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 80) return false;
  await db.workspace.update({ where: { id: workspaceId }, data: { name: trimmed } });
  return true;
}

/**
 * Deletes a workspace and everything in it. Database rows go by cascade; stored files are
 * removed with `deleteFile` first (best effort, so a storage hiccup never blocks deletion).
 */
export async function deleteWorkspace(
  db: PrismaClient,
  workspaceId: string,
  deleteFile: (key: string) => Promise<unknown>,
) {
  const assets = await db.asset.findMany({ where: { workspaceId }, select: { key: true } });
  await Promise.allSettled(assets.map((a) => deleteFile(a.key)));
  // Versions keep their model with onDelete: Restrict; remove products (and versions) first.
  await db.product.deleteMany({ where: { workspaceId } });
  await db.workspace.delete({ where: { id: workspaceId } });
}
