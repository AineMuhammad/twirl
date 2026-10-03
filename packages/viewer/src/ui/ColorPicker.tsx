'use client';

import { useEffect, useRef } from 'react';
import { HexColorInput, HexColorPicker } from 'react-colorful';

import { focusRing } from './ui';

export interface ColorPickerProps {
  color: string;
  onChange: (hex: string) => void;
  onDone: () => void;
  /** Used for the accessible name, e.g. "Iron". */
  label: string;
}

/**
 * Inline color picker that opens right where it was requested: saturation area, hue slider,
 * live preview and a hex field. Sliders are keyboard accessible (arrow keys).
 */
export function ColorPicker({ color, onChange, onDone, label }: ColorPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Bring the picker into view where it opened (it can start below the fold on phones).
  useEffect(() => {
    ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, []);
  return (
    <div
      ref={ref}
      role="group"
      aria-label={`Custom color for ${label}`}
      className="twirl-color-picker mt-3 rounded-2xl border border-line bg-surface p-3 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.2)]"
    >
      <HexColorPicker color={color} onChange={onChange} />
      <div className="mt-3 flex items-center gap-2">
        <span
          aria-hidden
          className="size-9 shrink-0 rounded-xl shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)]"
          style={{ background: color }}
        />
        <div className="flex min-w-0 flex-1 items-center rounded-xl border border-line bg-tint px-3 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
          <span className="text-[14px] text-ink-faint">#</span>
          <HexColorInput
            color={color}
            onChange={onChange}
            aria-label={`Hex color for ${label}`}
            className="w-full bg-transparent py-2 pl-1 font-mono text-[14px] uppercase outline-none"
          />
        </div>
        <button
          type="button"
          onClick={onDone}
          className={`rounded-xl bg-ink px-3.5 py-2 text-[14px] font-medium text-surface hover:opacity-90 ${focusRing}`}
        >
          Done
        </button>
      </div>
    </div>
  );
}
