import Link from 'next/link';

import { requireWorkspace } from '@/server/auth/session';
import { db } from '@/server/db';
import { countPublishedProducts } from '@/server/plans';
import { eventCounts } from '@/server/events';
import { listProducts } from '@/server/products';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export default async function DashboardPage() {
  const { user, workspace } = await requireWorkspace();
  const [published, products, models] = await Promise.all([
    countPublishedProducts(db(), workspace.id),
    listProducts(db(), workspace.id),
    db().asset.findMany({
      where: { workspaceId: workspace.id, status: 'READY' },
      select: { id: true, status: true },
    }),
  ]);

  const stats = await eventCounts(
    db(),
    workspace.id,
    products.map((p) => p.id),
  );
  const firstName = user.name?.split(' ')[0];
  const readyModels = models.filter((m) => m.status === 'READY');
  const steps = [
    {
      title: 'Upload your 3D model',
      text: 'A .glb or .gltf file of your product, up to 15 MB.',
      done: models.length > 0,
    },
    {
      title: 'Create a product from it',
      text: 'In 3D models, click “Create product” next to it.',
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
          className="rounded-xl bg-surface p-6 ring-1 ring-line"
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

      <div>
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
              {products.length > 0 && (
                <Link
                  href="/dashboard/models"
                  className="inline-flex h-10 shrink-0 items-center rounded-lg bg-brand-600 px-4 text-[14px] font-medium text-white shadow-sm hover:bg-brand-700"
                >
                  New product
                </Link>
              )}
            </div>
            {products.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-line bg-surface/50 px-6 py-10 text-center">
                <p className="text-[15px] font-medium text-ink">No products yet</p>
                <p className="mt-1 text-[14px] text-ink-muted">
                  {readyModels.length > 0
                    ? 'Open 3D models and choose “Create product” next to a model.'
                    : 'Start by uploading a 3D model of your product.'}
                </p>
                <p className="mt-4">
                  <Link
                    href="/dashboard/models"
                    className="inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 text-[14px] font-medium text-white shadow-sm hover:bg-brand-700"
                  >
                    {readyModels.length > 0 ? 'Go to 3D models' : 'Upload a model'}
                  </Link>
                </p>
              </div>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/dashboard/products/${product.id}`}
                      className="group flex h-full flex-col justify-between gap-4 rounded-xl bg-surface p-5 ring-1 ring-line transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)] hover:ring-brand-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:hover:ring-brand-500/50"
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
                            {plural(stats.get(product.id)?.visitors ?? 0, 'visitor')} ·{' '}
                            {plural(stats.get(product.id)?.quote_request ?? 0, 'quote')}{' '}
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
        </div>
      </div>
    </div>
  );
}
