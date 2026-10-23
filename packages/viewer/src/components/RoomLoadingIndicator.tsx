import { type CSSProperties, useEffect, useState } from 'react';

import type { LoadProgress, RoomMood } from '../types';

const card: CSSProperties = {
  position: 'absolute',
  left: '50%',
  top: '50%',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 18px 10px 10px',
  borderRadius: 18,
  background: 'rgba(255, 253, 249, 0.86)',
  backdropFilter: 'blur(14px) saturate(1.2)',
  WebkitBackdropFilter: 'blur(14px) saturate(1.2)',
  boxShadow: '0 14px 40px -14px rgba(30, 20, 10, 0.45), inset 0 0 0 1px rgba(0, 0, 0, 0.06)',
  font: '500 13px/1.25 system-ui, sans-serif',
  color: '#262320',
  pointerEvents: 'none',
  transition: 'opacity 300ms ease, transform 300ms ease',
};

const RING = 15; // radius
const CIRCUMFERENCE = 2 * Math.PI * RING;

function formatMegabytes(bytes: number) {
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

/** A small sofa, drawn inside the progress ring. */
function SofaGlyph() {
  return (
    <path
      d="M12.5 17.5v-2.2a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v2.2M11 21.5v-3a1.5 1.5 0 0 1 3 0v1h8v-1a1.5 1.5 0 0 1 3 0v3h-14zM12.5 21.5v1.5M23.5 21.5v1.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

export interface RoomLoadingIndicatorProps {
  /** What's being set up, e.g. "lounge". */
  name: string;
  mood: RoomMood;
  /** Downloading the room, or preparing its lighting once it's here. */
  phase: 'download' | 'lighting';
  progress: LoadProgress;
  /** False fades the card out (the room is ready). */
  visible: boolean;
}

/**
 * Shown, centred over the blurred scene, while a room downloads and while its lighting is
 * prepared. Appears after a short delay (a cached room never flashes it) and fades out when the
 * room is in.
 */
export function RoomLoadingIndicator({
  name,
  mood,
  phase,
  progress,
  visible,
}: RoomLoadingIndicatorProps) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!visible) {
      const hide = setTimeout(() => setShown(false), 0);
      return () => clearTimeout(hide);
    }
    const show = setTimeout(() => setShown(true), 200);
    return () => clearTimeout(show);
  }, [visible]);

  const { fraction, loadedBytes } = progress;
  const lighting = phase === 'lighting';
  // While lighting, the ring spins: there's no byte count for shader compiling.
  const percent = lighting || fraction === null ? null : Math.round(fraction * 100);
  const light = mood === 'day' ? 'Daylight' : 'Evening light';
  const detail = lighting
    ? 'Almost there'
    : percent === null
      ? `${light} · ${formatMegabytes(loadedBytes)}`
      : `${light} · ${percent}%`;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!shown}
      style={{
        ...card,
        opacity: shown ? 1 : 0,
        transform: `translate(-50%, calc(-50% + ${shown ? 0 : 6}px))`,
      }}
    >
      <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden style={{ color: '#3a3430' }}>
        <circle
          cx="18"
          cy="18"
          r={RING}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.12"
          strokeWidth="2.5"
        />
        <circle
          cx="18"
          cy="18"
          r={RING}
          fill="none"
          stroke="var(--color-brand-600, #1f4272)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={
            percent === null
              ? CIRCUMFERENCE * 0.72
              : CIRCUMFERENCE * (1 - Math.max(0.04, percent / 100))
          }
          transform="rotate(-90 18 18)"
          style={{ transition: 'stroke-dashoffset 250ms ease' }}
        >
          {percent === null && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="-90 18 18"
              to="270 18 18"
              dur="1s"
              repeatCount="indefinite"
            />
          )}
        </circle>
        <SofaGlyph />
      </svg>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontWeight: 600 }}>
          {lighting ? `Lighting the ${name}…` : `Setting up the ${name}…`}
        </span>
        <span style={{ color: '#6f6863', fontVariantNumeric: 'tabular-nums' }}>{detail}</span>
      </span>
    </div>
  );
}
