import { NextResponse } from 'next/server';

import { databaseEnabled, db } from '@/server/db';

export const dynamic = 'force-dynamic';

/** For uptime monitors: 200 when the app and its database respond, 503 otherwise. */
export async function GET() {
  let database: 'ok' | 'down' | 'not-configured' = 'not-configured';
  if (databaseEnabled) {
    try {
      await db().$queryRaw`SELECT 1`;
      database = 'ok';
    } catch (error) {
      console.error('[health] database check failed', error);
      database = 'down';
    }
  }
  const healthy = database !== 'down';
  return NextResponse.json(
    { ok: healthy, database },
    { status: healthy ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
