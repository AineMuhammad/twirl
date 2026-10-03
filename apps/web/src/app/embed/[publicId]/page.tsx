import type { Metadata } from 'next';

import { EmbedApp } from '@/components/embed/EmbedApp';
import { APP_NAME } from '@/config/app';
import { databaseEnabled, db } from '@/server/db';
import { getPublishedProduct } from '@/server/embed';
import { publicUrl } from '@/server/storage/r2';

type Params = { params: Promise<{ publicId: string }> };

function load(publicId: string) {
  return databaseEnabled ? getPublishedProduct(db(), publicId) : Promise.resolve(null);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const product = await load((await params).publicId);
  return {
    title: product ? `${product.config.product.name} · ${APP_NAME}` : APP_NAME,
    robots: { index: false },
  };
}

/** The published configurator on its own, for iframes on merchants' sites. */
export default async function EmbedPage({ params }: Params) {
  const product = await load((await params).publicId);
  if (!product) {
    return (
      <main className="grid h-dvh place-items-center bg-tint p-6 text-center">
        <div>
          <p className="text-[17px] font-semibold text-ink">This product isn&apos;t available</p>
          <p className="mt-1 text-[15px] text-ink-muted">It may have been unpublished.</p>
        </div>
      </main>
    );
  }
  return (
    <EmbedApp
      publicId={product.publicId}
      config={product.config}
      modelUrl={publicUrl(product.modelKey)}
      watermark={product.watermark}
    />
  );
}
