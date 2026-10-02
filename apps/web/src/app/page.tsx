import { VIEWER_SUPPORTED_SCHEMA_VERSION } from '@twirl/viewer';

import { APP_DESCRIPTION, APP_NAME } from '@/config/app';

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-4 px-6 py-24">
      <h1 className="text-4xl font-semibold tracking-tight">{APP_NAME}</h1>
      <p className="text-lg text-neutral-600 dark:text-neutral-400">{APP_DESCRIPTION}</p>
      <p className="text-sm text-neutral-500">Config schema v{VIEWER_SUPPORTED_SCHEMA_VERSION}</p>
    </main>
  );
}
