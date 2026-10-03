/**
 * Rejects cross-site requests to mutating endpoints. Browsers send `Origin` on POST/DELETE;
 * it must match this site.
 */
export function isSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}
