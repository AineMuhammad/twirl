import type { z } from 'zod';

import type { clientSchema } from './schema';

/**
 * Browser-safe environment. `NEXT_PUBLIC_*` values are inlined at build time and validated
 * then (next.config.ts parses `clientSchema` and fails the build), so this module deliberately
 * doesn't import Zod: that would add ~350 KB to every page's JavaScript. Each variable must be
 * read explicitly for Next.js to inline it.
 */
export const clientEnv: z.output<typeof clientSchema> = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || undefined,
  NEXT_PUBLIC_ASSETS_BASE_URL:
    process.env.NEXT_PUBLIC_ASSETS_BASE_URL?.replace(/\/+$/, '') || undefined,
};
