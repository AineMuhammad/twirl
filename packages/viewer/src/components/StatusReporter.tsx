import { useEffect } from 'react';

import type { EnvironmentStatus } from '../types';

/** Reports a status when mounted. Used inside Suspense fallbacks and loaded content. */
export function StatusReporter({
  status,
  onStatus,
}: {
  status: EnvironmentStatus;
  onStatus: (status: EnvironmentStatus) => void;
}) {
  useEffect(() => {
    onStatus(status);
  }, [status, onStatus]);
  return null;
}
