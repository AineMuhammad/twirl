import { z } from 'zod';

/**
 * Environment schemas. Add variables as features land and document every one
 * of them in the root `.env.example`.
 *
 * This file has no `server-only` guard so next.config.ts can import it.
 */
const DEPLOYED_REQUIRED = [
  'DATABASE_URL',
  'AUTH_SECRET',
  'AUTH_GOOGLE_ID',
  'AUTH_GOOGLE_SECRET',
  'RESEND_API_KEY',
  'EMAIL_FROM',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
  'R2_PUBLIC_URL',
  'KV_REST_API_URL',
  'KV_REST_API_TOKEN',
] as const;

export const serverSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    /**
     * Pooled Postgres connection string (Neon). Optional locally so the public pages run without
     * a database; required on Vercel.
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
    /** Auth.js session-signing secret: `openssl rand -base64 32`. */
    AUTH_SECRET: z.string().min(32, 'Use at least 32 characters.').optional(),
    AUTH_GOOGLE_ID: z.string().optional(),
    AUTH_GOOGLE_SECRET: z.string().optional(),
    /** Comma-separated admin emails. */
    ADMIN_EMAILS: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    /** Sender for sign-in links and notifications, e.g. "Twirl <hello@example.com>". */
    EMAIL_FROM: z.string().optional(),
    /** Cloudflare R2 (S3-compatible) for uploaded models. Token: Object Read & Write. */
    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET: z.string().optional(),
    /** Public base URL serving the bucket (custom domain or r2.dev), without a trailing slash. */
    R2_PUBLIC_URL: z
      .url()
      .transform((url) => url.replace(/\/+$/, ''))
      .optional(),
    /** Upstash Redis REST API (added by Vercel's Redis integration) for rate limiting. */
    KV_REST_API_URL: z.url().optional(),
    KV_REST_API_TOKEN: z.string().optional(),
    /** Set by Vercel ('production' | 'preview' | 'development'). */
    VERCEL_ENV: z.string().optional(),
  })
  // Deployed apps need sign-in; CI and local builds without these still build the public pages.
  .superRefine((env, ctx) => {
    if (!env.VERCEL_ENV || env.VERCEL_ENV === 'development') return;
    for (const name of DEPLOYED_REQUIRED) {
      if (!env[name])
        ctx.addIssue({ code: 'custom', path: [name], message: 'Required on Vercel.' });
    }
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
