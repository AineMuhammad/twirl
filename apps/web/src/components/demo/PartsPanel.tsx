'use client';

import type { MeshOverrides, MeshTreeNode } from '@twirl/viewer';
import { useEffect, useId, useRef, useState } from 'react';

import { DEMO_SWATCHES, isHidden, patchOverride } from '@/lib/overrides';
import { prettyPartName } from '@/lib/part-names';

import { ColorPicker } from './ColorPicker';
import { CheckIcon, ChevronIcon, EyeIcon, EyeOffIcon, ResetIcon } from './icons';
import { focusRing, RAINBOW } from './ui';

export interface PartsPanelProps {
  nodes: MeshTreeNode[];
  overrides: MeshOverrides;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onOverridesChange: (overrides: MeshOverrides) => void;
}

/**
 * Every part of the model with show/hide and color controls. Parts are chosen here, not by
 * clicking the model, and nothing is outlined in 3D. Everything is a button or input, so the
 * panel works fully with the keyboard.
 */
export function PartsPanel(props: PartsPanelProps) {
  if (props.nodes.length === 0) {
    return (
      <div className="space-y-2 px-5 py-2" aria-busy>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-tint" />
        ))}
      </div>
    );
  }
  return (
    <ul className="space-y-2 px-5 pb-6" aria-label="Parts">
      {props.nodes.map((node) => (
        <PartRow key={node.id} node={node} depth={0} {...props} />
      ))}
    </ul>
  );
}

const CHECKER = 'repeating-conic-gradient(#e5e5e5 0 25%, #fff 0 50%) 50% / 8px 8px';

function isLight(hex: string) {
  const n = Number.parseInt(hex.slice(1), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 160;
}

function PartRow({
  node,
  depth,
  overrides,
  selectedId,
  onSelect,
  onOverridesChange,
  nodes,
}: PartsPanelProps & { node: MeshTreeNode; depth: number }) {
  const name = prettyPartName(node.name);
  const hidden = isHidden(overrides, node.id);
  const color = overrides[node.id]?.color;
  const open = node.id === selectedId;
  const [customOpen, setCustomOpen] = useState(false);
  const pickerId = useId();
  const swatchesRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open) swatchesRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [open]);
  const isCustom = color !== undefined && !DEMO_SWATCHES.some((s) => s.hex === color);
  const update = (patch: Parameters<typeof patchOverride>[2]) =>
    onOverridesChange(patchOverride(overrides, node.id, patch));

  return (
    <li style={{ marginLeft: depth * 12 }}>
      <div
        className={`rounded-2xl border bg-surface transition-shadow ${open ? 'border-brand-200 shadow-[0_0_0_3px_var(--color-brand-100)] dark:border-brand-500/60 dark:shadow-[0_0_0_3px_rgb(99_102_241_/_0.22)]' : 'border-line hover:border-ink-faint/40'}`}
      >
        <div className="flex items-center">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={pickerId}
            title={node.name}
            onClick={() => {
              onSelect(open ? null : node.id);
              setCustomOpen(false);
            }}
            className={`flex min-w-0 flex-1 items-center gap-3 rounded-2xl py-3 pr-2 pl-3 text-left ${focusRing}`}
          >
            <span
              aria-hidden
              className="size-8 shrink-0 rounded-xl shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)]"
              style={{ background: color ?? CHECKER }}
            />
            <span className="min-w-0 flex-1">
              <span
                className={`block truncate text-sm font-medium ${hidden ? 'text-ink-faint line-through' : 'text-ink'} ${node.hasName ? '' : 'italic'}`}
              >
                {name}
              </span>
              <span className="block truncate text-xs text-ink-muted">
                {hidden
                  ? 'Hidden'
                  : color
                    ? (DEMO_SWATCHES.find((s) => s.hex === color)?.name ?? color.toUpperCase())
                    : 'Original finish'}
              </span>
            </span>
            <ChevronIcon
              className={`shrink-0 text-ink-faint transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
            />
          </button>
          <button
            type="button"
            aria-pressed={!hidden}
            aria-label={`${hidden ? 'Show' : 'Hide'} ${name}`}
            title={hidden ? 'Show' : 'Hide'}
            onClick={() => update({ visible: hidden ? undefined : false })}
            className={`mr-2 rounded-xl p-2.5 transition-colors ${hidden ? 'bg-ink text-surface' : 'text-ink-faint hover:bg-tint hover:text-ink'} ${focusRing}`}
          >
            {hidden ? <EyeOffIcon width={18} height={18} /> : <EyeIcon width={18} height={18} />}
          </button>
        </div>

        {open && (
          <div ref={swatchesRef} id={pickerId} className="border-t border-line px-3 pt-3 pb-3">
            <div role="group" aria-label={`Color for ${name}`} className="grid grid-cols-7 gap-2">
              {DEMO_SWATCHES.map((swatch) => {
                const active = color === swatch.hex;
                return (
                  <button
                    key={swatch.hex}
                    type="button"
                    aria-label={swatch.name}
                    aria-pressed={active}
                    title={swatch.name}
                    onClick={() => {
                      update({ color: swatch.hex });
                      setCustomOpen(false);
                    }}
                    className={`grid aspect-square place-items-center rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] transition-transform duration-150 hover:scale-110 ${focusRing} ${active ? 'ring-2 ring-brand-600 ring-offset-2 ring-offset-surface' : ''}`}
                    style={{ background: swatch.hex }}
                  >
                    {active && (
                      <CheckIcon
                        width={14}
                        height={14}
                        className={isLight(swatch.hex) ? 'text-ink' : 'text-white'}
                      />
                    )}
                  </button>
                );
              })}
              <button
                type="button"
                aria-label="Custom color"
                aria-expanded={customOpen}
                aria-pressed={isCustom}
                title="Custom color"
                onClick={() => setCustomOpen((v) => !v)}
                className={`grid aspect-square place-items-center rounded-full transition-transform duration-150 hover:scale-110 ${focusRing} ${isCustom || customOpen ? 'ring-2 ring-brand-600 ring-offset-2 ring-offset-surface' : ''}`}
                style={{ background: isCustom ? color : RAINBOW }}
              >
                {!isCustom && (
                  <span
                    aria-hidden
                    className="text-base leading-none font-semibold text-white drop-shadow"
                  >
                    +
                  </span>
                )}
              </button>
            </div>

            {customOpen && (
              <ColorPicker
                label={name}
                color={color ?? '#4f46e5'}
                onChange={(hex) => update({ color: hex })}
                onDone={() => setCustomOpen(false)}
              />
            )}

            <div className="mt-3 flex items-center justify-between gap-2 text-xs text-ink-muted">
              <span className="truncate">
                {node.triangleCount.toLocaleString()} triangles
                {node.materialNames.length > 0 && ` · ${node.materialNames.join(', ')}`}
              </span>
              <button
                type="button"
                disabled={!color}
                onClick={() => {
                  update({ color: undefined });
                  setCustomOpen(false);
                }}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 font-medium text-ink-soft hover:bg-tint disabled:opacity-40 disabled:hover:bg-transparent ${focusRing}`}
              >
                <ResetIcon width={14} height={14} /> Original
              </button>
            </div>
          </div>
        )}
      </div>

      {node.children.length > 0 && (
        <ul className="mt-2 space-y-2">
          {node.children.map((child) => (
            <PartRow
              key={child.id}
              node={child}
              depth={depth + 1}
              nodes={nodes}
              overrides={overrides}
              selectedId={selectedId}
              onSelect={onSelect}
              onOverridesChange={onOverridesChange}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
