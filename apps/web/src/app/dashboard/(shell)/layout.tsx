import type { ReactNode } from 'react';

import { AppShell } from '@/components/dashboard/AppShell';
import { PLANS } from '@/config/plans';
import { requireWorkspace } from '@/server/auth/session';
import { db } from '@/server/db';
import { countPublishedProducts } from '@/server/plans';
import { countNewQuotes } from '@/server/quotes';

import { signOutAction } from '../actions';

/** Dashboard pages inside the app frame (the product editor uses the full screen instead). */
export default async function DashboardShellLayout({ children }: { children: ReactNode }) {
  const { user, workspace } = await requireWorkspace();
  const [newQuotes, live] = await Promise.all([
    countNewQuotes(db(), workspace.id),
    countPublishedProducts(db(), workspace.id),
  ]);
  const plan = PLANS[workspace.plan];
  return (
    <AppShell
      workspaceName={workspace.name}
      user={{ email: user.email, name: user.name, isAdmin: user.isAdmin }}
      newQuotes={newQuotes}
      plan={{ label: plan.label, used: live, limit: plan.maxPublishedProducts }}
      signOut={signOutAction}
    >
      {children}
    </AppShell>
  );
}
