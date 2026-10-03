import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { PLANS } from '@/config/plans';
import { requireWorkspace } from '@/server/auth/session';
import { db } from '@/server/db';
import { countPublishedProducts } from '@/server/plans';

import { DeleteWorkspaceForm, RenameWorkspaceForm } from './SettingsForms';

export const metadata: Metadata = { title: 'Settings' };

function Section({
  title,
  description,
  children,
  tone = 'default',
}: {
  title: string;
  description: string;
  children: ReactNode;
  tone?: 'default' | 'danger';
}) {
  return (
    <section
      className={`grid gap-6 rounded-xl bg-surface p-6 ring-1 md:grid-cols-[240px_1fr] ${tone === 'danger' ? 'ring-red-200 dark:ring-red-500/30' : 'ring-line'}`}
    >
      <div>
        <h2
          className={`text-[16px] font-semibold ${tone === 'danger' ? 'text-red-700 dark:text-red-300' : 'text-ink'}`}
        >
          {title}
        </h2>
        <p className="mt-1 text-[14px] text-ink-muted">{description}</p>
      </div>
      <div>{children}</div>
    </section>
  );
}

export default async function SettingsPage() {
  const { user, workspace } = await requireWorkspace('/dashboard/settings');
  const live = await countPublishedProducts(db(), workspace.id);
  const plan = PLANS[workspace.plan];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold tracking-tight text-ink">Settings</h1>
        <p className="mt-1 text-[15px] text-ink-muted">Your workspace, account and plan.</p>
      </div>

      <Section title="Workspace" description="The name shown in your dashboard.">
        <RenameWorkspaceForm name={workspace.name} />
      </Section>

      <Section title="Account" description="How you sign in.">
        <dl className="space-y-3 text-[15px]">
          <div>
            <dt className="text-[13px] text-ink-muted">Email</dt>
            <dd className="text-ink">{user.email}</dd>
          </div>
          {user.name && (
            <div>
              <dt className="text-[13px] text-ink-muted">Name</dt>
              <dd className="text-ink">{user.name}</dd>
            </div>
          )}
        </dl>
      </Section>

      <Section title="Plan" description="What your workspace can publish.">
        <p className="text-[15px] text-ink">
          <span className="font-semibold">{plan.label}</span> · {live} of{' '}
          {plan.maxPublishedProducts} live product{plan.maxPublishedProducts === 1 ? '' : 's'}
        </p>
        <Link
          href="/pricing"
          className="mt-2 inline-block text-[14px] font-medium text-brand-700 hover:underline dark:text-brand-200"
        >
          Compare plans or upgrade
        </Link>
      </Section>

      <Section
        tone="danger"
        title="Delete workspace"
        description="Permanently deletes every product, model, quote and share link. This can’t be undone."
      >
        <DeleteWorkspaceForm name={workspace.name} />
      </Section>
    </div>
  );
}
