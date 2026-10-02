import type { CSSProperties } from 'react';

const pill: CSSProperties = {
  position: 'absolute',
  left: '50%',
  bottom: 16,
  transform: 'translateX(-50%)',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 14px 8px 10px',
  borderRadius: 999,
  background: 'rgba(255, 255, 255, 0.82)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  boxShadow: '0 8px 30px -10px rgba(0, 0, 0, 0.35), inset 0 0 0 1px rgba(0, 0, 0, 0.06)',
  font: '500 13px/1 system-ui, sans-serif',
  color: '#262626',
  pointerEvents: 'none',
};

/** Shown while an HDRI environment loads (studio light stands in meanwhile). */
export function EnvironmentIndicator() {
  return (
    <div style={pill} role="status" aria-live="polite">
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
        <circle
          cx="12"
          cy="12"
          r="9"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth="3"
        />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 12 12"
            to="360 12 12"
            dur="0.8s"
            repeatCount="indefinite"
          />
        </path>
      </svg>
      Loading lighting…
    </div>
  );
}
