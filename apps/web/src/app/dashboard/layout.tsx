import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { APP_NAME } from '@/config/app';
import { requireWorkspace } from '@/server/auth/session';

export const metadata: Metadata = { title: `Dashboard · ${APP_NAME}` };

/** Everything under /dashboard needs a signed-in user with a workspace. */
export default async function DashboardRootLayout({ children }: { children: ReactNode }) {
  await requireWorkspace();
  return children;
}
