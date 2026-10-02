import { useEffect, useRef } from 'react';

import type { MeshOverride, MeshOverrides, MeshTreeNode } from '../src';

export interface MeshTreePanelProps {
  nodes: MeshTreeNode[];
  overrides: MeshOverrides;
  selectedId: string | null;
  onChange: (id: string, override: MeshOverride | null) => void;
  onHover: (id: string | null) => void;
}

/** Dev-only mesh tree for exercising color/visibility/highlight/picking. Not the product UI. */
export function MeshTreePanel(props: MeshTreePanelProps) {
  return (
    <ul role="tree" aria-label="Meshes" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {props.nodes.map((node) => (
        <Row key={node.id} node={node} depth={0} {...props} />
      ))}
    </ul>
  );
}

function Row({
  node,
  depth,
  overrides,
  selectedId,
  onChange,
  onHover,
}: MeshTreePanelProps & { node: MeshTreeNode; depth: number }) {
  const override = overrides[node.id] ?? {};
  const selected = node.id === selectedId;
  const ref = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (selected) ref.current?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  // `undefined` in a patch clears that field.
  const update = (patch: { [K in keyof MeshOverride]?: MeshOverride[K] | undefined }) => {
    const merged = { ...override, ...patch };
    const next: MeshOverride = {};
    if (merged.color !== undefined) next.color = merged.color;
    if (merged.visible !== undefined) next.visible = merged.visible;
    onChange(node.id, Object.keys(next).length > 0 ? next : null);
  };

  return (
    <li ref={ref} role="treeitem" aria-selected={selected}>
      <div
        onPointerEnter={() => onHover(node.id)}
        onPointerLeave={() => onHover(null)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          paddingLeft: depth * 14,
          background: selected ? '#dbeafe' : undefined,
          fontStyle: node.hasName ? undefined : 'italic',
        }}
      >
        <input
          type="checkbox"
          aria-label={`Show ${node.name}`}
          checked={override.visible ?? true}
          onChange={(e) => update({ visible: e.target.checked ? undefined : false })}
        />
        <input
          type="color"
          aria-label={`Color of ${node.name}`}
          value={override.color ?? '#ffffff'}
          onChange={(e) => update({ color: e.target.value })}
          style={{ width: 22, height: 18, padding: 0, border: 'none' }}
        />
        <span title={`${node.kind} · ${node.triangleCount.toLocaleString()} triangles`}>
          {node.name}
        </span>
        {override.color && (
          <button
            type="button"
            onClick={() => update({ color: undefined })}
            aria-label={`Reset color of ${node.name}`}
          >
            ↺
          </button>
        )}
      </div>
      {node.children.length > 0 && (
        <ul role="group" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {node.children.map((child) => (
            <Row
              key={child.id}
              node={child}
              depth={depth + 1}
              nodes={[]}
              overrides={overrides}
              selectedId={selectedId}
              onChange={onChange}
              onHover={onHover}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
