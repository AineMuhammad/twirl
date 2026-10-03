import { NextResponse } from 'next/server';

import { apiError, apiWorkspace } from '@/server/api';
import { checkUploaded } from '@/server/assets/upload';
import { db } from '@/server/db';
import { deleteObject, headObject } from '@/server/storage/r2';

/**
 * Confirms an upload: checks the stored object against what was declared and marks the asset
 * ready (or invalid, removing the object). Model contents are validated in the next step.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await apiWorkspace(request);
  if (auth.error) return auth.error;
  const { id } = await params;

  const asset = await db().asset.findFirst({ where: { id, workspaceId: auth.workspace.id } });
  if (!asset) return apiError(404, 'Upload not found.');
  if (asset.status !== 'PENDING') return NextResponse.json({ id, status: asset.status });

  const check = checkUploaded(asset, await headObject(asset.key));
  if (!check.ok) {
    await deleteObject(asset.key).catch((error: unknown) => {
      console.error('[assets] failed to remove rejected upload', asset.id, error);
    });
    await db().asset.update({
      where: { id },
      data: { status: 'INVALID', validation: { errors: [check.reason] } },
    });
    return apiError(422, check.reason);
  }
  await db().asset.update({
    where: { id },
    data: { status: 'READY', uploadedAt: new Date() },
  });
  return NextResponse.json({ id, status: 'READY' });
}
