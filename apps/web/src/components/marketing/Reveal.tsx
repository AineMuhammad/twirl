'use client';

import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';

/**
 * Fades its content up the first time it scrolls into view. `delay` (ms) staggers neighbours.
 * The motion itself is CSS (`[data-reveal]` in globals.css) and is skipped for reduced motion.
 */
export function Reveal({
  children,
  delay = 0,
  as = 'div',
  className,
}: {
  children: ReactNode;
  delay?: number;
  as?: 'div' | 'li' | 'section';
  className?: string;
}) {
  const Tag = as as 'div';
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-reveal=""
      data-shown={shown ? '' : undefined}
      className={className}
      style={{ '--delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
