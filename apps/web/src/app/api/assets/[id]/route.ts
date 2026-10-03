import { NextResponse } from 'next/server';

import { apiError, apiWorkspace } from '@/server/api';
import { db } from '@/server/db';
import { deleteObject } from '@/server/storage/r2';

/** Deletes an uploaded model, unless a product version uses it. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await apiWorkspace(request);
  if (auth.error) return auth.error;
  const { id } = await params;

  const asset = await db().asset.findFirst({
    where: { id, workspaceId: auth.workspace.id },
    include: { _count: { select: { versions: true } } },
  });
  if (!asset) return apiError(404, 'Model not found.');
  if (asset._count.versions > 0) {
    return apiError(409, 'This model is used by a product. Change the product first.');
  }
  await deleteObject(asset.key);
  await db().asset.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
