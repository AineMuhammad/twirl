import Link from 'next/link';

import { PLANS } from '@/config/plans';
import { requireWorkspace } from '@/server/auth/session';
import { db } from '@/server/db';
import { countPublishedProducts } from '@/server/plans';
import { listProducts } from '@/server/products';
import { storageEnabled } from '@/server/storage/r2';
import { DeleteModelButton } from '@/components/dashboard/DeleteModelButton';
import { ModelReportDetails } from '@/components/dashboard/ModelReportDetails';
import { ModelUploader } from '@/components/dashboard/ModelUploader';

const RECENT_PENDING_MS = 60 * 60 * 1000;

function formatBytes(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default async function DashboardPage() {
  const { user, workspace } = await requireWorkspace();
  const plan = PLANS[workspace.plan];
  const [published, products, models] = await Promise.all([
    countPublishedProducts(db(), workspace.id),
    listProducts(db(), workspace.id),
    // Abandoned uploads stay PENDING; only show recent ones.
    db().asset.findMany({
      where: {
        workspaceId: workspace.id,
        OR: [
          { status: { not: 'PENDING' } },
          // eslint-disable-next-line react-hooks/purity -- request-time cutoff, not render state
          { createdAt: { gte: new Date(Date.now() - RECENT_PENDING_MS) } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Welcome{user.name ? `, ${user.name.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {workspace.name} · {plan.label} plan
        </p>
      </div>
      <section className="rounded-3xl bg-surface p-8 ring-1 ring-line" aria-label="Plan usage">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-base font-semibold text-ink">{plan.label} plan</h2>
          <p className="text-sm text-ink-muted tabular-nums">
            {published} of {plan.maxPublishedProducts} published product
            {plan.maxPublishedProducts === 1 ? '' : 's'}
          </p>
        </div>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-tint-strong"
          role="progressbar"
          aria-label="Published products"
          aria-valuemin={0}
          aria-valuemax={plan.maxPublishedProducts}
          aria-valuenow={published}
        >
          <div
            className="h-full rounded-full bg-brand-600"
            style={{ width: `${Math.min(100, (published / plan.maxPublishedProducts) * 100)}%` }}
          />
        </div>
        <p className="mt-3 text-xs text-ink-muted">
          {plan.watermark
            ? 'Configurators and downloaded images show a small watermark on this plan.'
            : 'No watermark on this plan.'}
        </p>
      </section>
      <section className="rounded-3xl bg-surface p-8 ring-1 ring-line" aria-labelledby="products">
        <h2 id="products" className="text-base font-semibold text-ink">
          Products
        </h2>
        {products.length === 0 ? (
          <p className="mt-1 text-sm text-ink-muted">
            Upload a model below, then choose “Create product” to build its configurator.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {products.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/dashboard/products/${product.id}`}
                  className="flex items-center gap-4 rounded-lg py-3 hover:bg-tint"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">
                      {product.name}
                    </span>
                    <span className="block text-xs text-ink-muted">
                      Edited {product.updatedAt.toLocaleDateString('en-US')}
                    </span>
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${product.publishedVersionId ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-tint-strong text-ink-soft'}`}
                  >
                    {product.publishedVersionId ? 'Published' : 'Draft'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-3xl bg-surface p-8 ring-1 ring-line" aria-labelledby="models">
        <h2 id="models" className="text-base font-semibold text-ink">
          Models
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Upload your product&apos;s 3D model, then create a product from it.
        </p>
        <div className="mt-5">
          <ModelUploader enabled={storageEnabled} />
        </div>
        {models.length > 0 && (
          <ul className="mt-4 divide-y divide-line" aria-label="Uploaded models">
            {models.map((model) => (
              <li key={model.id} className="flex items-start gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{model.filename}</p>
                  <p className="text-xs text-ink-muted">
                    {formatBytes(model.size)} · {model.createdAt.toLocaleDateString('en-US')}
                  </p>
                  <ModelReportDetails validation={model.validation} />
                </div>
                <StatusBadge status={model.status} />
                {model.status === 'READY' && (
                  <Link
                    href={`/dashboard/products/new?model=${model.id}`}
                    className="rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700"
                  >
                    Create product
                  </Link>
                )}
                <DeleteModelButton id={model.id} filename={model.filename} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: 'PENDING' | 'READY' | 'INVALID' }) {
  const styles = {
    PENDING: 'bg-tint-strong text-ink-soft',
    READY: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    INVALID: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  } as const;
  const labels = { PENDING: 'Uploading', READY: 'Ready', INVALID: 'Rejected' } as const;
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
