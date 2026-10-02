'use client';

import type { MeshOverrides, MeshTreeNode } from '@twirl/viewer';
import { useEffect, useId, useRef } from 'react';

import { DEMO_SWATCHES, isHidden, patchOverride } from '@/lib/overrides';

import { ChevronIcon, EyeIcon, EyeOffIcon, ResetIcon } from './icons';

export interface PartsPanelProps {
  nodes: MeshTreeNode[];
  overrides: MeshOverrides;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Hover/focus a part to outline it in 3D. */
  onHighlight: (id: string | null) => void;
  onOverridesChange: (overrides: MeshOverrides) => void;
}

/**
 * Every part of the model with show/hide and color controls. Rows are plain buttons, so the
 * whole panel works with Tab/Shift+Tab, Enter and Space.
 */
export function PartsPanel(props: PartsPanelProps) {
  if (props.nodes.length === 0) {
    return <p className="p-4 text-sm text-neutral-500">Load a model to see its parts.</p>;
  }
  return (
    <ul className="space-y-0.5 p-2" aria-label="Parts">
      {props.nodes.map((node) => (
        <PartRow key={node.id} node={node} depth={0} {...props} />
      ))}
    </ul>
  );
}

function PartRow({
  node,
  depth,
  overrides,
  selectedId,
  onSelect,
  onHighlight,
  onOverridesChange,
  nodes,
}: PartsPanelProps & { node: MeshTreeNode; depth: number }) {
  const hidden = isHidden(overrides, node.id);
  const color = overrides[node.id]?.color;
  const selected = node.id === selectedId;
  const pickerId = useId();
  const rowRef = useRef<HTMLDivElement>(null);

  // When a part is picked in 3D, bring its row into view.
  useEffect(() => {
    if (selected) rowRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selected]);

  const update = (patch: Parameters<typeof patchOverride>[2]) =>
    onOverridesChange(patchOverride(overrides, node.id, patch));

  return (
    <li>
      <div
        ref={rowRef}
        className={`flex items-center gap-1 rounded-md pr-2 ${selected ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-neutral-100'}`}
        style={{ paddingLeft: 4 + depth * 16 }}
        onPointerEnter={() => onHighlight(node.id)}
        onPointerLeave={() => onHighlight(null)}
      >
        <button
          type="button"
          className="rounded p-1.5 text-neutral-500 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-blue-600"
          aria-pressed={!hidden}
          aria-label={`${hidden ? 'Show' : 'Hide'} ${node.name}`}
          title={hidden ? 'Show' : 'Hide'}
          onClick={() => update({ visible: hidden ? undefined : false })}
          onFocus={() => onHighlight(node.id)}
          onBlur={() => onHighlight(null)}
        >
          {hidden ? <EyeOffIcon /> : <EyeIcon />}
        </button>
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 rounded py-1.5 text-left text-sm focus-visible:outline-2 focus-visible:outline-blue-600"
          aria-expanded={selected}
          aria-controls={pickerId}
          onClick={() => onSelect(selected ? null : node.id)}
          onFocus={() => onHighlight(node.id)}
          onBlur={() => onHighlight(null)}
        >
          <ChevronIcon className={`shrink-0 transition-transform ${selected ? 'rotate-90' : ''}`} />
          <span
            aria-hidden
            className="size-4 shrink-0 rounded-full border border-neutral-300"
            style={{
              background:
                color ?? 'repeating-conic-gradient(#e5e5e5 0 25%, #fff 0 50%) 50% / 8px 8px',
            }}
          />
          <span
            className={`truncate ${hidden ? 'text-neutral-400 line-through' : ''} ${node.hasName ? '' : 'italic'}`}
          >
            {node.name}
          </span>
          <span className="ml-auto shrink-0 text-xs text-neutral-400">
            {node.triangleCount.toLocaleString()} ▲
          </span>
        </button>
      </div>

      {selected && (
        <div
          id={pickerId}
          className="mt-1 mb-2 space-y-2 px-3"
          style={{ paddingLeft: 12 + depth * 16 }}
        >
          <div
            role="group"
            aria-label={`Color for ${node.name}`}
            className="flex flex-wrap gap-1.5"
          >
            {DEMO_SWATCHES.map((swatch) => (
              <button
                key={swatch.hex}
                type="button"
                aria-label={swatch.name}
                aria-pressed={color === swatch.hex}
                title={swatch.name}
                onClick={() => update({ color: swatch.hex })}
                className={`size-7 rounded-full border border-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${color === swatch.hex ? 'ring-2 ring-blue-600 ring-offset-2' : ''}`}
                style={{ background: swatch.hex }}
              />
            ))}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="color"
                value={color ?? '#ffffff'}
                onChange={(e) => update({ color: e.target.value })}
                className="h-7 w-9 cursor-pointer rounded border border-neutral-300 bg-white p-0.5"
              />
              Custom
            </label>
            <button
              type="button"
              disabled={!color}
              onClick={() => update({ color: undefined })}
              className="ml-auto flex items-center gap-1 rounded px-2 py-1 text-neutral-600 hover:bg-neutral-100 disabled:opacity-40"
            >
              <ResetIcon /> Original
            </button>
          </div>
          {node.materialNames.length > 0 && (
            <p className="text-xs text-neutral-500">Material: {node.materialNames.join(', ')}</p>
          )}
        </div>
      )}

      {node.children.length > 0 && (
        <ul className="space-y-0.5">
          {node.children.map((child) => (
            <PartRow
              key={child.id}
              node={child}
              depth={depth + 1}
              nodes={nodes}
              overrides={overrides}
              selectedId={selectedId}
              onSelect={onSelect}
              onHighlight={onHighlight}
              onOverridesChange={onOverridesChange}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
