import { readReport } from '@/lib/model-report';

function formatBytes(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** One-line summary plus expandable warnings, errors and textures for an uploaded model. */
export function ModelReportDetails({ validation }: { validation: unknown }) {
  const { report, errors, warnings } = readReport(validation);
  if (!report && errors.length === 0) return null;
  const summary = report
    ? [
        `${report.meshCount} mesh${report.meshCount === 1 ? '' : 'es'}`,
        `${report.triangleCount.toLocaleString('en-US')} triangles`,
        `${report.textures.length} texture${report.textures.length === 1 ? '' : 's'}`,
        report.animationCount > 0
          ? `${report.animationCount} animation${report.animationCount === 1 ? '' : 's'}`
          : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : null;
  const hasDetails = warnings.length > 0 || (report?.textures.length ?? 0) > 0;

  return (
    <div className="mt-1.5 text-[13px]">
      {summary && <p className="text-ink-muted">{summary}</p>}
      {errors.length > 0 && (
        <ul className="mt-1 space-y-0.5 text-red-600 dark:text-red-400">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      {hasDetails && (
        <details className="mt-1">
          <summary className="cursor-pointer text-ink-soft hover:text-ink">
            {warnings.length > 0
              ? `${warnings.length} warning${warnings.length === 1 ? '' : 's'}`
              : 'Details'}
          </summary>
          {warnings.length > 0 && (
            <ul className="mt-1.5 space-y-1 text-amber-700 dark:text-amber-400">
              {warnings.map((w) => (
                <li key={w.code}>{w.message}</li>
              ))}
            </ul>
          )}
          {report && report.textures.length > 0 && (
            <ul className="mt-1.5 space-y-0.5 text-ink-muted">
              {report.textures.map((t, i) => (
                <li key={`${t.name ?? ''}-${i}`}>
                  {t.name ?? `Texture ${i + 1}`} ·{' '}
                  {t.width && t.height ? `${t.width}×${t.height}` : 'size unknown'} ·{' '}
                  {t.mimeType.replace('image/', '').toUpperCase()} · {formatBytes(t.bytes)}
                </li>
              ))}
            </ul>
          )}
        </details>
      )}
    </div>
  );
}
