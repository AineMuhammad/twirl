// Applies pending database migrations during Vercel builds (production and previews), before
// the app that needs them goes live. Elsewhere (local, CI) it does nothing: run
// `pnpm --filter @twirl/web db:deploy` yourself.
import { execSync } from 'node:child_process';

if (process.env.VERCEL) {
  process.stdout.write('[migrate] Applying database migrations…\n');
  execSync('prisma migrate deploy', { stdio: 'inherit' });
}
