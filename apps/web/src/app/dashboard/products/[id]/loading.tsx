/** Shown while the editor loads: header, step list and preview placeholders. */
export default function EditorLoading() {
  return (
    <div className="flex h-dvh flex-col bg-tint" aria-busy aria-label="Loading the editor">
      <div className="h-16 shrink-0 border-b border-line bg-surface" />
      <div className="flex min-h-0 flex-1">
        <div className="hidden w-[500px] space-y-3 border-r border-line bg-surface p-6 lg:block">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-tint" />
          ))}
        </div>
        <div className="flex-1 animate-pulse bg-tint" />
      </div>
    </div>
  );
}
