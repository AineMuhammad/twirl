import { requireWorkspace } from '@/server/auth/session';

export default async function DashboardPage() {
  const { user, workspace } = await requireWorkspace();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Welcome{user.name ? `, ${user.name.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {workspace.name} · {workspace.plan.charAt(0) + workspace.plan.slice(1).toLowerCase()} plan
        </p>
      </div>
      <section className="rounded-3xl bg-surface p-8 ring-1 ring-line">
        <h2 className="text-base font-semibold text-ink">Products</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Uploading models and building configurators is coming next.
        </p>
      </section>
    </div>
  );
}
