'use client';

import { useEffect, useRef, useState } from 'react';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * A number that rolls to `value`: from zero when it first scrolls into view, then from its last
 * value whenever `value` changes.
 */
export function CountUp({
  value,
  format = (n) => Math.round(n).toLocaleString('en-US'),
  duration = 1200,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setInView(true);
        observer.disconnect();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const start = from.current;
    if (reducedMotion() || start === value) {
      from.current = value;
      setShown(value);
      return;
    }
    const t0 = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / duration);
      const eased = 1 - (1 - k) ** 3;
      const n = start + (value - start) * eased;
      from.current = n;
      setShown(n);
      if (k < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {format(shown)}
    </span>
  );
}
