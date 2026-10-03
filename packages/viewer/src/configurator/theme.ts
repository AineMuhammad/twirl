import type { CSSProperties } from 'react';

/**
 * CSS variables that re-tint the brand palette (`bg-brand-600`, `ring-brand-500`, …) to a
 * merchant's accent colour for everything inside the element they're set on.
 */
export function accentVars(accent: string): CSSProperties {
  const mix = (percent: number, other: string) =>
    `color-mix(in oklab, ${accent} ${percent}%, ${other})`;
  return {
    '--color-brand-50': mix(8, 'white'),
    '--color-brand-100': mix(15, 'white'),
    '--color-brand-200': mix(32, 'white'),
    '--color-brand-500': mix(85, 'white'),
    '--color-brand-600': accent,
    '--color-brand-700': mix(82, 'black'),
    '--color-brand-900': mix(40, 'black'),
  } as CSSProperties;
}

/** Heading classes for the configured display font. */
export function titleFontClass(font: 'geist' | 'instrument-serif'): string {
  return font === 'instrument-serif' ? 'font-display' : 'font-sans font-semibold tracking-tight';
}
