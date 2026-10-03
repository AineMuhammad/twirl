import 'server-only';

import { PrismaPg } from '@prisma/adapter-pg';

import { serverEnv } from '@/env/server';
import { PrismaClient } from '@/generated/prisma/client';

/**
 * The app's single Prisma client (one connection pool per server instance). Uses Neon's pooled
 * URL in production via the standard `pg` driver.
 *
 * Created on first use, so pages that don't touch the database (the demo) work without one.
 */
function createClient() {
  const connectionString = serverEnv.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. See .env.example to configure the database.');
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

// Reuse one client across hot reloads in development instead of opening a new pool each time.
const globalForPrisma = globalThis as unknown as { twirlPrisma?: PrismaClient };

export function db(): PrismaClient {
  globalForPrisma.twirlPrisma ??= createClient();
  return globalForPrisma.twirlPrisma;
}
