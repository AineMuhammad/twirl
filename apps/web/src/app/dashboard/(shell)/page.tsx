import Link from 'next/link';

import { PLANS } from '@/config/plans';
import { requireWorkspace } from '@/server/auth/session';
import { db } from '@/server/db';
import { countPublishedProducts } from '@/server/plans';
import { eventCounts } from '@/server/events';
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

  const stats = await eventCounts(
    db(),
    workspace.id,
    products.map((p) => p.id),
  );
  const firstName = user.name?.split(' ')[0];
  const readyModels = models.filter((m) => m.status === 'READY');
  const usage = Math.min(100, (published / plan.maxPublishedProducts) * 100);
  const steps = [
    {
      title: 'Upload your 3D model',
      text: 'A .glb or .gltf file of your product, up to 15 MB.',
      done: models.length > 0,
    },
    {
      title: 'Create a product from it',
      text: 'Click “Create product” next to the model.',
      done: products.length > 0,
    },
    {
      title: 'Add options and publish',
      text: 'Pick the customisable parts, colours and prices.',
      done: published > 0,
    },
  ];
  const gettingStarted = !steps.every((s) => s.done);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight text-ink">
          Welcome{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="mt-1 text-[15px] text-ink-muted">
          Turn your 3D models into product configurators shoppers can play with.
        </p>
      </div>

      {gettingStarted && (
        <section
          aria-labelledby="getting-started"
          className="rounded-2xl bg-surface p-6 ring-1 ring-line"
        >
          <h2 id="getting-started" className="text-[17px] font-semibold text-ink">
            Getting started
          </h2>
          <ol className="mt-4 grid gap-3 md:grid-cols-3">
            {steps.map((step, i) => (
              <li
                key={step.title}
                className={`flex gap-3 rounded-xl p-4 ring-1 ${step.done ? 'bg-emerald-50/60 ring-emerald-200 dark:bg-emerald-500/5 dark:ring-emerald-500/25' : 'bg-tint/50 ring-line'}`}
              >
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-full text-[14px] font-semibold ${step.done ? 'bg-emerald-600 text-white' : 'bg-surface text-ink-soft ring-1 ring-line'}`}
                  aria-hidden
                >
                  {step.done ? '✓' : i + 1}
                </span>
                <div>
                  <p className="text-[15px] font-medium text-ink">
                    {step.title}
                    {step.done && <span className="sr-only"> (done)</span>}
                  </p>
                  <p className="mt-0.5 text-[13px] text-ink-muted">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          {/* Products */}
          <section aria-labelledby="products" className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 id="products" className="text-[20px] font-semibold tracking-tight text-ink">
                  Products
                </h2>
                <p className="mt-0.5 text-[14px] text-ink-muted">
                  Each product is a configurator built from one of your models.
                </p>
              </div>
            </div>
            {products.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-line bg-surface/50 px-6 py-10 text-center">
                <p className="text-[15px] font-medium text-ink">No products yet</p>
                <p className="mt-1 text-[14px] text-ink-muted">
                  {readyModels.length > 0
                    ? 'Choose “Create product” next to one of your models below.'
                    : 'Upload a 3D model below first.'}
                </p>
              </div>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {products.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/dashboard/products/${product.id}`}
                      className="group hover:ring-brand-300 flex h-full flex-col justify-between gap-4 rounded-2xl bg-surface p-5 ring-1 ring-line transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:hover:ring-brand-500/50"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-[16px] font-semibold text-ink">{product.name}</p>
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-medium ${product.publishedVersionId ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200'}`}
                          >
                            {product.publishedVersion
                              ? `Live · v${product.publishedVersion.number}`
                              : 'Draft · not live'}
                          </span>
                        </div>
                        {product.publishedVersion && (
                          <p className="mt-2 text-[13px] text-ink-soft">
                            {stats.get(product.id)?.visitors ?? 0} visitors ·{' '}
                            {stats.get(product.id)?.quote_request ?? 0} quotes{' '}
                            <span className="text-ink-faint">(30 days)</span>
                          </p>
                        )}
                        <p className="mt-1 text-[13px] text-ink-muted">
                          Last edited{' '}
                          {product.updatedAt.toLocaleDateString('en-US', { dateStyle: 'medium' })}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[14px] font-medium text-brand-700 group-hover:underline dark:text-brand-200">
                        Edit product →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Models */}
          <section aria-labelledby="models" className="space-y-4">
            <div>
              <h2 id="models" className="text-[20px] font-semibold tracking-tight text-ink">
                3D models
              </h2>
              <p className="mt-0.5 text-[14px] text-ink-muted">
                Upload a model once, then create one or more products from it.
              </p>
            </div>
            <div className="rounded-2xl bg-surface p-5 ring-1 ring-line">
              <ModelUploader enabled={storageEnabled} />
              {models.length > 0 && (
                <ul className="mt-2 divide-y divide-line" aria-label="Uploaded models">
                  {models.map((model) => (
                    <li key={model.id} className="flex flex-wrap items-start gap-x-4 gap-y-3 py-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-[15px] font-medium text-ink">
                            {model.filename}
                          </p>
                          <StatusBadge status={model.status} />
                        </div>
                        <p className="mt-0.5 text-[13px] text-ink-muted">
                          {formatBytes(model.size)} · uploaded{' '}
                          {model.createdAt.toLocaleDateString('en-US', { dateStyle: 'medium' })}
                        </p>
                        <ModelReportDetails validation={model.validation} />
                      </div>
                      <div className="flex items-center gap-2">
                        {model.status === 'READY' && (
                          <Link
                            href={`/dashboard/products/new?model=${model.id}`}
                            className="inline-flex h-9 items-center rounded-lg bg-brand-600 px-3.5 text-[14px] font-medium text-white shadow-sm hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                          >
                            Create product
                          </Link>
                        )}
                        <DeleteModelButton id={model.id} filename={model.filename} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        {/* Plan */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start" aria-label="Your plan">
          <section className="rounded-2xl bg-surface p-5 ring-1 ring-line">
            <p className="text-[13px] font-medium tracking-wide text-ink-muted uppercase">
              Your plan
            </p>
            <p className="mt-1 text-[22px] font-semibold tracking-tight text-ink">{plan.label}</p>
            <p className="mt-4 flex items-baseline justify-between text-[14px]">
              <span className="text-ink-soft">Live products</span>
              <span className="font-medium text-ink tabular-nums">
                {published} of {plan.maxPublishedProducts}
              </span>
            </p>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-tint-strong"
              role="progressbar"
              aria-label="Live products used"
              aria-valuemin={0}
              aria-valuemax={plan.maxPublishedProducts}
              aria-valuenow={published}
            >
              <div
                className={`h-full rounded-full ${usage >= 100 ? 'bg-amber-500' : 'bg-brand-600'}`}
                style={{ width: `${usage}%` }}
              />
            </div>
            <p className="mt-3 text-[13px] leading-snug text-ink-muted">
              Drafts are unlimited; only live products count.{' '}
              {plan.watermark
                ? 'Your configurators show a small watermark on this plan.'
                : 'No watermark on this plan.'}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: 'PENDING' | 'READY' | 'INVALID' }) {
  const styles = {
    PENDING: 'bg-tint-strong text-ink-soft',
    READY: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    INVALID: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  } as const;
  const labels = { PENDING: 'Uploading…', READY: 'Ready', INVALID: "Can't be used" } as const;
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
