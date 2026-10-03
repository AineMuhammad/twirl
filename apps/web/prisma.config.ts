import { existsSync } from 'node:fs';

import { defineConfig } from 'prisma/config';

// The CLI doesn't read Next.js env files; load the local one if present (CI and Vercel set real
// environment variables instead).
if (existsSync('.env.local')) process.loadEnvFile('.env.local');

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    // Migrations need a direct connection; Neon's pooled URL doesn't support them. `generate`
    // needs no database, so a missing URL only fails commands that connect.
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? '',
  },
});
