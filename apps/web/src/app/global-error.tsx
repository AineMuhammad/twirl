'use client';

/** Last-resort error screen when the root layout itself fails (no app styles available). */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          display: 'grid',
          placeItems: 'center',
          minHeight: '100dvh',
          margin: 0,
          textAlign: 'center',
        }}
      >
        <div>
          <h1 style={{ fontSize: 24 }}>Something went wrong</h1>
          <p style={{ color: '#737373' }}>Please try again.</p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 16, padding: '10px 18px', fontSize: 15 }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
