import type { ViewerError, ViewerErrorKind } from '../types';

const MESSAGES: Record<ViewerErrorKind, string> = {
  network: "We couldn't download this 3D model. Check your connection and try again.",
  parse:
    "This file couldn't be opened as a 3D model. It may be damaged or in an unsupported format.",
  unknown: 'Something went wrong while showing this 3D model.',
};

/** Maps loader failures to a friendly message. The original error is kept in `cause` for logging. */
export function toViewerError(cause: unknown): ViewerError {
  const text = cause instanceof Error ? cause.message : String(cause);
  let kind: ViewerErrorKind = 'unknown';
  if (/fetch|network|status\s*\d{3}|404|403|failed to load|load failed/i.test(text)) {
    kind = 'network';
  } else if (
    /json|unexpected|parse|gltf|glb|magic|version|invalid|unsupported|draco|extension/i.test(text)
  ) {
    kind = 'parse';
  }
  return { kind, message: MESSAGES[kind], cause };
}

export function progressFromEvent(
  event: Pick<ProgressEvent, 'lengthComputable' | 'loaded' | 'total'>,
) {
  const fraction =
    event.lengthComputable && event.total > 0 ? Math.min(1, event.loaded / event.total) : null;
  return { fraction, loadedBytes: event.loaded };
}
