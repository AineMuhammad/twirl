import { z } from 'zod';

/**
 * Environment schemas. Add variables as features land and document every one
 * of them in the root `.env.example`.
 *
 * This file has no `server-only` guard so next.config.ts can import it.
 */
export const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  /**
   * Pooled Postgres connection string (Neon). Optional until sign-in lands; features that need
   * the database fail with a clear error without it.
   */
  DATABASE_URL: z
    .string()
    .regex(/^postgres(ql)?:\/\//, 'Use a postgresql:// connection string.')
    .optional(),
  /** Direct (non-pooled) connection string, used only by Prisma migrations. */
  DATABASE_URL_UNPOOLED: z
    .string()
    .regex(/^postgres(ql)?:\/\//, 'Use a postgresql:// connection string.')
    .optional(),
});

/**
 * Browser-safe variables. Only `NEXT_PUBLIC_*` belongs here, and each must be
 * read explicitly in client.ts so Next.js can inline it at build time.
 */
export const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url().optional(),
  /** Public base URL of the asset bucket (Cloudflare R2), without a trailing slash. */
  NEXT_PUBLIC_ASSETS_BASE_URL: z
    .url()
    .transform((url) => url.replace(/\/+$/, ''))
    .optional(),
});
