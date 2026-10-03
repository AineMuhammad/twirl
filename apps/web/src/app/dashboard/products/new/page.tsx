import { notFound } from 'next/navigation';

import { NewProduct } from '@/components/editor/NewProduct';
import { requireWorkspace } from '@/server/auth/session';
import { db } from '@/server/db';
import { publicUrl } from '@/server/storage/r2';

export default async function NewProductPage({
  searchParams,
}: {
  searchParams: Promise<{ model?: string }>;
}) {
  const { workspace } = await requireWorkspace();
  const modelId = (await searchParams).model;
  if (!modelId) notFound();
  const asset = await db().asset.findFirst({
    where: { id: modelId, workspaceId: workspace.id, status: 'READY' },
    select: { id: true, key: true, filename: true },
  });
  if (!asset) notFound();
  return (
    <NewProduct assetId={asset.id} modelUrl={publicUrl(asset.key)} filename={asset.filename} />
  );
}
