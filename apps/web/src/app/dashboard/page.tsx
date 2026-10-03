import { PLANS } from '@/config/plans';
import { requireWorkspace } from '@/server/auth/session';
import { db } from '@/server/db';
import { countPublishedProducts } from '@/server/plans';

export default async function DashboardPage() {
  const { user, workspace } = await requireWorkspace();
  const plan = PLANS[workspace.plan];
  const published = await countPublishedProducts(db(), workspace.id);
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
      <section className="rounded-3xl bg-surface p-8 ring-1 ring-line">
        <h2 className="text-base font-semibold text-ink">Products</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Uploading models and building configurators is coming next.
        </p>
      </section>
    </div>
  );
}
