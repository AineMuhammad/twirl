import type { Metadata } from 'next';
import Link from 'next/link';

import { EmbedApp } from '@/components/embed/EmbedApp';
import { APP_NAME } from '@/config/app';
import { databaseEnabled, db } from '@/server/db';
import { getShare } from '@/server/shares';
import { publicUrl } from '@/server/storage/r2';

type Params = { params: Promise<{ shortId: string }> };

function load(shortId: string) {
  return databaseEnabled ? getShare(db(), shortId) : Promise.resolve(null);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const share = await load((await params).shortId);
  return {
    title: share ? share.config.product.name : APP_NAME,
    robots: { index: false },
  };
}

/** A shopper's shared design: the exact version and choices they saved. */
export default async function SharedDesignPage({ params }: Params) {
  const share = await load((await params).shortId);
  if (!share) {
    return (
      <main className="grid h-dvh place-items-center bg-tint p-6 text-center">
        <div>
          <p className="text-[17px] font-semibold text-ink">This link doesn&apos;t work any more</p>
          <p className="mt-1 text-[15px] text-ink-muted">The product may have been removed.</p>
          <Link href="/" className="mt-4 inline-block text-[15px] font-medium text-brand-700">
            Go to {APP_NAME}
          </Link>
        </div>
      </main>
    );
  }
  return (
    <EmbedApp
      publicId={share.publicId}
      versionId={share.versionId}
      config={share.config}
      modelUrl={publicUrl(share.modelKey)}
      watermark={share.watermark}
      initialSelections={share.selections}
    />
  );
}
