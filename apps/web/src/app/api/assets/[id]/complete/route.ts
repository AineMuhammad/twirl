import { NextResponse } from 'next/server';

import { apiError, apiWorkspace } from '@/server/api';
import { checkUploaded } from '@/server/assets/upload';
import type { Prisma } from '@/generated/prisma/client';
import { inspectModel, type ModelReport } from '@/lib/model-report';
import { db } from '@/server/db';
import { deleteObject, getObjectBytes, headObject } from '@/server/storage/r2';

/**
 * Confirms an upload: checks the stored object against what was declared, then reads the model
 * and stores its validation report. Valid models become READY; anything else becomes INVALID and
 * its file is removed (the report explains why).
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await apiWorkspace(request);
  if (auth.error) return auth.error;
  const { id } = await params;

  const asset = await db().asset.findFirst({ where: { id, workspaceId: auth.workspace.id } });
  if (!asset) return apiError(404, 'Upload not found.');
  if (asset.status !== 'PENDING') return NextResponse.json({ id, status: asset.status });

  const reject = async (validation: Prisma.InputJsonObject, message: string) => {
    await deleteObject(asset.key).catch((error: unknown) => {
      console.error('[assets] failed to remove rejected upload', asset.id, error);
    });
    await db().asset.update({ where: { id }, data: { status: 'INVALID', validation } });
    return apiError(422, message);
  };

  const check = checkUploaded(asset, await headObject(asset.key));
  if (!check.ok) return reject({ errors: [check.reason] }, check.reason);

  // The browser checked too, but only the server's report is trusted.
  const report = inspectModel(await getObjectBytes(asset.key), asset.filename);
  if (report.errors.length > 0) {
    return reject(asJson(report), report.errors[0] ?? 'This model is not valid.');
  }
  await db().asset.update({
    where: { id },
    data: { status: 'READY', uploadedAt: new Date(), validation: asJson(report) },
  });
  return NextResponse.json({ id, status: 'READY', report });
}

/** The report is plain JSON data; Prisma's JSON type just can't see that through an interface. */
function asJson(report: ModelReport): Prisma.InputJsonObject {
  return report as unknown as Prisma.InputJsonObject;
}
