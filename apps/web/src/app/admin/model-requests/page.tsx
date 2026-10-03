import { requireAdmin } from '@/server/auth/session';
import { db } from '@/server/db';
import { listModelRequests } from '@/server/model-requests';

import { StatusSelect } from './StatusSelect';

export default async function ModelRequestsPage() {
  await requireAdmin();
  const requests = await listModelRequests(db());
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Model requests</h1>
        <p className="mt-1 text-[14px] text-ink-muted">
          Requests for the 3D-modelling service, newest first.
        </p>
      </div>
      {requests.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-line px-6 py-10 text-center text-[15px] text-ink-muted">
          No requests yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => (
            <li key={r.id} className="rounded-2xl bg-surface p-5 ring-1 ring-line">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[16px] font-semibold text-ink">
                    {r.name}
                    {r.company && (
                      <span className="font-normal text-ink-muted"> · {r.company}</span>
                    )}
                  </p>
                  <p className="text-[14px] text-ink-muted">
                    <a
                      href={`mailto:${r.email}`}
                      className="text-brand-700 hover:underline dark:text-brand-200"
                    >
                      {r.email}
                    </a>{' '}
                    · {r.createdAt.toLocaleDateString('en-US', { dateStyle: 'medium' })}
                    {r.workspace && <> · {r.workspace.name}</>}
                  </p>
                </div>
                <StatusSelect id={r.id} status={r.status} name={r.name} />
              </div>
              <p className="mt-3 text-[15px] whitespace-pre-wrap text-ink-soft">{r.description}</p>
              {r.links.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {r.links.map((link) => (
                    <li key={link} className="truncate text-[14px]">
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-700 hover:underline dark:text-brand-200"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
