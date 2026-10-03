import type { CSSProperties } from 'react';

import type { LoadProgress, ViewerError } from '../types';

export type OverlayState =
  | { phase: 'idle' }
  | { phase: 'loading'; progress: LoadProgress }
  | { phase: 'ready' }
  | { phase: 'error'; error: ViewerError };

const overlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 12,
  padding: 24,
  textAlign: 'center',
  pointerEvents: 'none',
  font: '500 14px/1.4 system-ui, sans-serif',
  color: 'var(--twirl-overlay-fg, #404040)',
};

const trackStyle: CSSProperties = {
  width: 'min(240px, 60%)',
  height: 6,
  borderRadius: 999,
  background: 'var(--twirl-overlay-track, rgba(0, 0, 0, 0.1))',
  overflow: 'hidden',
};

function formatMegabytes(bytes: number) {
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

export function LoadingOverlay({ state }: { state: OverlayState }) {
  if (state.phase === 'loading') {
    const { fraction, loadedBytes } = state.progress;
    const percent = fraction === null ? null : Math.round(fraction * 100);
    return (
      <div style={overlayStyle} role="status" aria-live="polite">
        <div
          style={trackStyle}
          role="progressbar"
          aria-label="Loading 3D model"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent ?? undefined}
        >
          <div
            style={{
              height: '100%',
              width: percent === null ? '30%' : `${percent}%`,
              background: 'var(--twirl-accent, #171717)',
              transition: 'width 120ms linear',
            }}
          />
        </div>
        <span>
          {percent === null
            ? `Loading 3D model… ${loadedBytes > 0 ? formatMegabytes(loadedBytes) : ''}`
            : `Loading 3D model… ${percent}%`}
        </span>
      </div>
    );
  }

  if (state.phase === 'error') {
    return (
      <div style={overlayStyle} role="alert">
        <span>{state.error.message}</span>
      </div>
    );
  }

  return null;
}
