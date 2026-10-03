import { randomUUID } from 'node:crypto';

import { NextResponse } from 'next/server';

import { apiError, apiWorkspace } from '@/server/api';
import { assetKey, modelTypeFor, uploadRequestSchema } from '@/server/assets/upload';
import { db } from '@/server/db';
import { presignUpload, storageEnabled } from '@/server/storage/r2';

/**
 * Starts an upload: records a pending asset and returns a presigned URL the browser PUTs the
 * file to. Body: `{ filename, size }`.
 */
export async function POST(request: Request) {
  const auth = await apiWorkspace(request);
  if (auth.error) return auth.error;
  if (!storageEnabled) return apiError(503, 'Uploads are not available right now.');

  const parsed = uploadRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiError(400, parsed.error.issues[0]?.message ?? 'Invalid upload request.');
  }
  const { filename, size } = parsed.data;
  // Chosen up front so the object key can include it.
  const id = randomUUID();
  const key = assetKey(auth.workspace.id, id, filename);
  const mimeType = modelTypeFor(filename);

  const asset = await db().asset.create({
    data: { id, workspaceId: auth.workspace.id, key, filename, size, mimeType },
    select: { id: true },
  });
  const upload = await presignUpload(key, mimeType, size);
  return NextResponse.json({ assetId: asset.id, upload }, { status: 201 });
}
