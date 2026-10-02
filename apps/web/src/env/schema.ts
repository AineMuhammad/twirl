import { z } from 'zod';

/**
 * Environment schemas. Add variables as features land and document every one
 * of them in the root `.env.example`.
 *
 * This file has no `server-only` guard so next.config.ts can import it.
 */
export const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

/**
 * Browser-safe variables. Only `NEXT_PUBLIC_*` belongs here, and each must be
 * read explicitly in client.ts so Next.js can inline it at build time.
 */
export const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url().optional(),
});
