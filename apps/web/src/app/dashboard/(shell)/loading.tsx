/** Shown while a dashboard page loads: the page's shape, without content. */
export default function DashboardLoading() {
  return (
    <div className="space-y-8" aria-busy aria-label="Loading">
      <div className="space-y-2">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-tint-strong" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-tint" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-surface ring-1 ring-line" />
        ))}
      </div>
    </div>
  );
}
