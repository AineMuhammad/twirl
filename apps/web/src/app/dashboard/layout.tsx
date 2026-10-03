import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { requireWorkspace } from '@/server/auth/session';

export const metadata: Metadata = { title: 'Dashboard' };

/** Everything under /dashboard needs a signed-in user with a workspace. */
export default async function DashboardRootLayout({ children }: { children: ReactNode }) {
  await requireWorkspace();
  return children;
}
