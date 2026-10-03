import type { EventBatch, EventType } from './events';
import { MAX_EVENTS_PER_BATCH } from './events';

const FLUSH_MS = 5000;
const SESSION_KEY = 'twirl:session';

/** A random id for this visit, kept for the tab only (no cookies). */
function sessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    // Storage can be blocked (private mode, some iframes): a new id per page load is fine.
    return crypto.randomUUID();
  }
}

/**
 * Queues events and sends them in batches: every few seconds while there's something to send,
 * and when the page is hidden or closed (via sendBeacon, which survives unloading).
 */
export function createTracker(
  target: { publicId: string; versionId: string },
  endpoint = '/api/events',
) {
  const session = sessionId();
  let queue: EventBatch['events'] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    while (queue.length > 0) {
      const events = queue.slice(0, MAX_EVENTS_PER_BATCH);
      queue = queue.slice(MAX_EVENTS_PER_BATCH);
      const body = JSON.stringify({ ...target, sessionId: session, events } satisfies EventBatch);
      // text/plain keeps it a simple request; the server parses the JSON itself.
      const blob = new Blob([body], { type: 'text/plain' });
      if (!navigator.sendBeacon?.(endpoint, blob)) {
        void fetch(endpoint, { method: 'POST', body, keepalive: true }).catch(() => {});
      }
    }
  };

  const onHide = () => {
    if (document.visibilityState === 'hidden') flush();
  };
  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('pagehide', flush);

  return {
    track(type: EventType, group?: string) {
      queue.push(group ? { type, group } : { type });
      if (queue.length >= MAX_EVENTS_PER_BATCH) flush();
      else timer ??= setTimeout(flush, FLUSH_MS);
    },
    /** Sends what's queued and stops listening. */
    stop() {
      flush();
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flush);
    },
  };
}

/** Option groups whose value changed between two evaluations. */
export function changedGroups(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): string[] {
  return Object.keys(after).filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
}
