import Link from 'next/link';

import { APP_DESCRIPTION, APP_NAME } from '@/config/app';

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-6 py-24">
      <h1 className="text-4xl font-semibold tracking-tight">{APP_NAME}</h1>
      <p className="text-lg text-neutral-600 dark:text-neutral-400">{APP_DESCRIPTION}</p>
      <p>
        <Link
          href="/demo"
          className="inline-block rounded-md bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-white dark:text-neutral-900"
        >
          Try the demo
        </Link>
      </p>
    </main>
  );
}
