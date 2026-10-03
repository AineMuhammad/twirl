import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Editor } from '@/components/editor/Editor';
import { requireWorkspace } from '@/server/auth/session';
import { db } from '@/server/db';
import { getProductForEditor, validateConfig } from '@/server/products';
import { eventCounts } from '@/server/events';
import { listVersions } from '@/server/versions';
import { publicUrl } from '@/server/storage/r2';

export const metadata: Metadata = { title: 'Edit product' };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { workspace } = await requireWorkspace();
  const found = await getProductForEditor(db(), workspace.id, (await params).id);
  if (!found) notFound();
  const { product, draft } = found;
  const parsed = validateConfig(draft.config);
  const asset = draft.modelAsset;

  if (!parsed.ok || !asset) {
    console.error('[editor] unusable draft', product.id, parsed.ok ? 'no model' : parsed.issues);
    return (
      <main className="grid min-h-dvh place-items-center bg-tint p-6 text-center">
        <div>
          <h1 className="text-lg font-semibold text-ink">This product can&apos;t be opened</h1>
          <p className="mt-1 text-[15px] text-ink-muted">
            Its saved configuration or model is missing. Please contact support.
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block text-[15px] font-medium text-brand-700"
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }
  const versions = await listVersions(db(), workspace.id, product.id);
  const stats = (await eventCounts(db(), workspace.id, [product.id])).get(product.id) ?? null;
  const liveVersion = versions.find((v) => v.live);
  const liveConfig = liveVersion ? validateConfig(liveVersion.config) : null;
  return (
    <Editor
      productId={product.id}
      publicId={product.publicId}
      stats={stats}
      initialConfig={parsed.config}
      modelUrl={publicUrl(asset.key)}
      versions={versions.map((v) => ({
        id: v.id,
        number: v.number,
        publishedAt: (v.publishedAt ?? new Date()).toISOString(),
        live: v.live,
      }))}
      live={
        liveVersion && liveConfig?.ok
          ? { number: liveVersion.number, configJson: JSON.stringify(liveConfig.config) }
          : null
      }
    />
  );
}
