import type { Metadata } from 'next';
import Link from 'next/link';

import { DeleteModelButton } from '@/components/dashboard/DeleteModelButton';
import { ModelReportDetails } from '@/components/dashboard/ModelReportDetails';
import { ModelUploader } from '@/components/dashboard/ModelUploader';
import { requireWorkspace } from '@/server/auth/session';
import { db } from '@/server/db';
import { storageEnabled } from '@/server/storage/r2';

export const metadata: Metadata = { title: '3D models' };

const RECENT_PENDING_MS = 60 * 60 * 1000;

function formatBytes(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default async function ModelsPage() {
  const { workspace } = await requireWorkspace('/dashboard/models');
  // Abandoned uploads stay PENDING; only show recent ones.
  const models = await db().asset.findMany({
    where: {
      workspaceId: workspace.id,
      OR: [
        { status: { not: 'PENDING' } },
        // eslint-disable-next-line react-hooks/purity -- request-time cutoff, not render state
        { createdAt: { gte: new Date(Date.now() - RECENT_PENDING_MS) } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <section aria-labelledby="models" className="space-y-4">
      <div>
        <h1 id="models" className="text-[28px] font-semibold tracking-tight text-ink">
          3D models
        </h1>
        <p className="mt-0.5 text-[14px] text-ink-muted">
          Upload a model once, then create one or more products from it.
        </p>
      </div>
      <div className="rounded-xl bg-surface p-5 ring-1 ring-line">
        <ModelUploader enabled={storageEnabled} />
        <p className="mt-1 text-[14px] text-ink-muted">
          No 3D model yet?{' '}
          <Link
            href="/request-model"
            className="font-medium text-brand-700 hover:underline dark:text-brand-200"
          >
            We can make one for you
          </Link>
        </p>
        {models.length > 0 && (
          <ul className="mt-2 divide-y divide-line" aria-label="Uploaded models">
            {models.map((model) => (
              <li key={model.id} className="flex flex-wrap items-start gap-x-4 gap-y-3 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[15px] font-medium text-ink">{model.filename}</p>
                    <StatusBadge status={model.status} />
                  </div>
                  <p className="mt-0.5 text-[13px] text-ink-muted">
                    {formatBytes(model.size)} · uploaded{' '}
                    {model.createdAt.toLocaleDateString('en-US', { dateStyle: 'medium' })}
                  </p>
                  <ModelReportDetails validation={model.validation} />
                </div>
                <div className="flex items-center gap-2">
                  {model.status === 'READY' && (
                    <Link
                      href={`/dashboard/products/new?model=${model.id}`}
                      className="inline-flex h-9 items-center rounded-lg bg-brand-600 px-3.5 text-[14px] font-medium text-white shadow-sm hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                    >
                      Create product
                    </Link>
                  )}
                  <DeleteModelButton id={model.id} filename={model.filename} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: 'PENDING' | 'READY' | 'INVALID' }) {
  const styles = {
    PENDING: 'bg-tint-strong text-ink-soft',
    READY: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    INVALID: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  } as const;
  const labels = { PENDING: 'Uploading…', READY: 'Ready', INVALID: "Can't be used" } as const;
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
