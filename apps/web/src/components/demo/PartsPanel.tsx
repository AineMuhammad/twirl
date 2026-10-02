'use client';

import type { MeshOverrides, MeshTreeNode } from '@twirl/viewer';
import { useId } from 'react';

import { DEMO_SWATCHES, isHidden, patchOverride } from '@/lib/overrides';
import { prettyPartName } from '@/lib/part-names';

import { CheckIcon, ChevronIcon, EyeIcon, EyeOffIcon, ResetIcon } from './icons';
import { focusRing } from './ui';

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
    return <p className="px-5 py-6 text-sm text-neutral-500">Loading parts…</p>;
  }
  return (
    <ul className="space-y-1 px-2 pb-4" aria-label="Parts">
      {props.nodes.map((node) => (
        <PartRow key={node.id} node={node} depth={0} {...props} />
      ))}
    </ul>
  );
}

const CHECKER = 'repeating-conic-gradient(#e5e5e5 0 25%, #fff 0 50%) 50% / 8px 8px';

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
  const pickerId = useId();
  const update = (patch: Parameters<typeof patchOverride>[2]) =>
    onOverridesChange(patchOverride(overrides, node.id, patch));

  return (
    <li>
      <div
        className={`group flex items-center rounded-2xl transition-colors ${open ? 'bg-neutral-900/[0.04]' : 'hover:bg-neutral-900/[0.03]'}`}
        style={{ paddingLeft: depth * 14 }}
      >
        <button
          type="button"
          aria-expanded={open}
          aria-controls={pickerId}
          title={node.name}
          onClick={() => onSelect(open ? null : node.id)}
          className={`flex min-w-0 flex-1 items-center gap-3 rounded-2xl py-2.5 pr-2 pl-3 text-left ${focusRing}`}
        >
          <span
            aria-hidden
            className="size-6 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]"
            style={{ background: color ?? CHECKER }}
          />
          <span className="min-w-0 flex-1">
            <span
              className={`block truncate text-sm font-medium ${hidden ? 'text-neutral-400 line-through' : 'text-neutral-900'} ${node.hasName ? '' : 'italic'}`}
            >
              {name}
            </span>
            <span className="block text-xs text-neutral-500">
              {color
                ? (DEMO_SWATCHES.find((s) => s.hex === color)?.name ?? color.toUpperCase())
                : 'Original'}
              {' · '}
              {node.triangleCount.toLocaleString()} triangles
            </span>
          </span>
          <ChevronIcon
            className={`shrink-0 text-neutral-400 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
          />
        </button>
        <button
          type="button"
          aria-pressed={!hidden}
          aria-label={`${hidden ? 'Show' : 'Hide'} ${name}`}
          title={hidden ? 'Show' : 'Hide'}
          onClick={() => update({ visible: hidden ? undefined : false })}
          className={`mr-1.5 rounded-full p-2.5 transition-colors ${hidden ? 'text-neutral-900' : 'text-neutral-400 hover:text-neutral-900'} hover:bg-white ${focusRing}`}
        >
          {hidden ? <EyeOffIcon width={18} height={18} /> : <EyeIcon width={18} height={18} />}
        </button>
      </div>

      {open && (
        <div id={pickerId} className="px-3 pt-2 pb-3" style={{ paddingLeft: 12 + depth * 14 }}>
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
                  onClick={() => update({ color: swatch.hex })}
                  className={`relative grid aspect-square place-items-center rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] transition-transform hover:scale-110 ${focusRing} ${active ? 'ring-2 ring-neutral-900 ring-offset-2' : ''}`}
                  style={{ background: swatch.hex }}
                >
                  {active && (
                    <CheckIcon
                      width={14}
                      height={14}
                      className={isLight(swatch.hex) ? 'text-neutral-900' : 'text-white'}
                    />
                  )}
                </button>
              );
            })}
            <label
              title="Custom color"
              className="relative grid aspect-square cursor-pointer place-items-center rounded-full transition-transform focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-neutral-900 hover:scale-110"
              style={{
                background:
                  'conic-gradient(from 90deg, #f43f5e, #f59e0b, #84cc16, #06b6d4, #6366f1, #d946ef, #f43f5e)',
              }}
            >
              <span className="sr-only">Custom color</span>
              <input
                type="color"
                value={color ?? '#ffffff'}
                onChange={(e) => update({ color: e.target.value })}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
            <span className="truncate">
              {node.materialNames.length > 0 && `Material: ${node.materialNames.join(', ')}`}
            </span>
            <button
              type="button"
              disabled={!color}
              onClick={() => update({ color: undefined })}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 font-medium text-neutral-700 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent ${focusRing}`}
            >
              <ResetIcon width={14} height={14} /> Original
            </button>
          </div>
        </div>
      )}

      {node.children.length > 0 && (
        <ul className="space-y-1">
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

/** Rough relative luminance check, to pick a readable checkmark color on a swatch. */
function isLight(hex: string) {
  const n = Number.parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 160;
}
