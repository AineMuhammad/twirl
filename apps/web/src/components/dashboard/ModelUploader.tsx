'use client';

import { useRouter } from 'next/navigation';
import { type DragEvent, useRef, useState } from 'react';

import { checkLocalModel } from '@/lib/local-model';
import { inspectModel } from '@/lib/model-report';

type State =
  | { phase: 'idle' }
  | { phase: 'uploading'; name: string; progress: number }
  | { phase: 'error'; message: string }
  | { phase: 'done'; name: string };

interface StartResponse {
  assetId: string;
  upload: { url: string; headers: Record<string, string> };
}

async function errorMessage(response: Response) {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? 'Something went wrong. Please try again.';
}

/** PUTs the file straight to storage, reporting progress (fetch can't report upload progress). */
function putFile(
  url: string,
  headers: Record<string, string>,
  file: File,
  onProgress: (p: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    for (const [name, value] of Object.entries(headers)) xhr.setRequestHeader(name, value);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`));
    xhr.onerror = () => reject(new Error('network'));
    xhr.send(file);
  });
}

/**
 * Upload a .glb/.gltf (up to 15 MB). Checked and inspected in the browser first, then sent
 * directly to storage with a short-lived signed URL, then validated again by the server.
 */
export function ModelUploader({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>({ phase: 'idle' });
  const [dragging, setDragging] = useState(false);
  const busy = state.phase === 'uploading';

  async function upload(file: File) {
    const check = await checkLocalModel(file);
    if (!check.ok) return setState({ phase: 'error', message: check.message });
    // Read the model first so obvious problems show before anything is uploaded.
    const report = inspectModel(new Uint8Array(await file.arrayBuffer()), file.name);
    if (report.errors.length > 0) {
      return setState({ phase: 'error', message: report.errors.join(' ') });
    }
    setState({ phase: 'uploading', name: file.name, progress: 0 });
    try {
      const start = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, size: file.size }),
      });
      if (!start.ok) return setState({ phase: 'error', message: await errorMessage(start) });
      const { assetId, upload: target } = (await start.json()) as StartResponse;

      await putFile(target.url, target.headers, file, (progress) =>
        setState({ phase: 'uploading', name: file.name, progress }),
      );

      const done = await fetch(`/api/assets/${assetId}/complete`, { method: 'POST' });
      if (!done.ok) return setState({ phase: 'error', message: await errorMessage(done) });
      setState({ phase: 'done', name: file.name });
      router.refresh();
    } catch (error) {
      console.error('[upload] failed', error);
      setState({
        phase: 'error',
        message: 'The upload failed. Check your connection and try again.',
      });
    }
  }

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file && enabled && !busy) void upload(file);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (enabled && !busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${dragging ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-line'}`}
      >
        {!enabled ? (
          <p className="text-sm text-ink-muted">Uploads aren&apos;t configured on this server.</p>
        ) : busy ? (
          <div className="w-full max-w-xs" aria-live="polite">
            <p className="truncate text-sm font-medium text-ink">Uploading {state.name}…</p>
            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-tint-strong"
              role="progressbar"
              aria-label="Upload progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(state.progress * 100)}
            >
              <div
                className="h-full rounded-full bg-brand-600 transition-[width]"
                style={{ width: `${state.progress * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-ink-soft">
              Drop a <span className="font-medium">.glb</span> or{' '}
              <span className="font-medium">.gltf</span> here, up to 15 MB
            </p>
            <button
              type="button"
              onClick={() => input.current?.click()}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              Choose a file
            </button>
          </>
        )}
        <input
          ref={input}
          type="file"
          accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = '';
          }}
        />
      </div>
      <div role="status" aria-live="polite" className="mt-2 min-h-5 text-sm">
        {state.phase === 'error' && (
          <span className="text-red-600 dark:text-red-400">{state.message}</span>
        )}
        {state.phase === 'done' && (
          <span className="text-emerald-600 dark:text-emerald-400">Uploaded {state.name}.</span>
        )}
      </div>
    </div>
  );
}
