'use client';

import { humanizeName, type ProductConfig } from '@twirl/config-schema/engine';

import {
  addPart,
  assignMesh,
  type MeshChoice,
  removePart,
  renamePart,
  unassignMesh,
} from './config-edit';
import { IconButton, inputClass } from './fields';
import { PlusIcon, TrashIcon, XIcon } from './icons';

export interface PartsEditorProps {
  config: ProductConfig;
  /** The model's meshes, or null while it loads. */
  meshes: MeshChoice[] | null;
  onChange: (config: ProductConfig) => void;
  /** Highlight a part in the preview while hovering it here. */
  onHover: (partId: string | null) => void;
}

/**
 * Parts are what shoppers configure: named groups of meshes. Each mesh belongs to at most one
 * part; meshes in no part can't be changed by shoppers.
 */
export function PartsEditor({ config, meshes, onChange, onHover }: PartsEditorProps) {
  if (!meshes) {
    return (
      <div className="space-y-2 p-5" aria-busy>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-tint" />
        ))}
      </div>
    );
  }
  const labelOf = new Map(meshes.map((m) => [m.ref, m.label]));
  const assigned = new Set(config.parts.flatMap((p) => p.meshes));
  const unassigned = meshes.filter((m) => !assigned.has(m.ref));

  return (
    <div className="space-y-6 p-5">
      <p className="text-xs text-ink-muted">
        Group your model&apos;s meshes into parts with friendly names. Options then target parts.
      </p>

      <ul className="space-y-3" aria-label="Parts">
        {config.parts.map((part) => (
          <li
            key={part.id}
            onMouseEnter={() => onHover(part.id)}
            onMouseLeave={() => onHover(null)}
            className="rounded-xl border border-line bg-surface p-3"
          >
            <div className="flex items-center gap-2">
              <input
                aria-label="Part name"
                className={inputClass}
                value={part.label}
                maxLength={80}
                onChange={(e) => onChange(renamePart(config, part.id, e.target.value))}
                onFocus={() => onHover(part.id)}
                onBlur={() => onHover(null)}
              />
              <IconButton
                label={`Remove part ${part.label}`}
                tone="danger"
                onClick={() => onChange(removePart(config, part.id))}
              >
                <TrashIcon />
              </IconButton>
            </div>
            <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={`Meshes in ${part.label}`}>
              {part.meshes.map((ref) => {
                const missing = !labelOf.has(ref);
                return (
                  <li
                    key={ref}
                    className={`flex items-center gap-1 rounded-full py-0.5 pr-0.5 pl-2.5 text-xs ${missing ? 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300' : 'bg-tint-strong text-ink-soft'}`}
                    title={missing ? 'This mesh is not in the model' : ref}
                  >
                    {missing ? `${ref} (missing)` : (labelOf.get(ref) ?? ref)}
                    <button
                      type="button"
                      aria-label={`Remove ${labelOf.get(ref) ?? ref} from ${part.label}`}
                      onClick={() => onChange(unassignMesh(config, ref))}
                      className="grid size-5 place-items-center rounded-full hover:bg-surface"
                    >
                      <XIcon width={10} height={10} />
                    </button>
                  </li>
                );
              })}
            </ul>
            {meshes.length > part.meshes.length && (
              <select
                aria-label={`Add a mesh to ${part.label}`}
                className={`${inputClass} mt-2 text-xs`}
                value=""
                onChange={(e) =>
                  e.target.value && onChange(assignMesh(config, part.id, e.target.value))
                }
              >
                <option value="">Add a mesh…</option>
                {meshes
                  .filter((m) => !part.meshes.includes(m.ref))
                  .map((m) => {
                    const owner = config.parts.find((p) => p.meshes.includes(m.ref));
                    return (
                      <option key={m.ref} value={m.ref}>
                        {m.label}
                        {owner ? ` (move from ${owner.label})` : ''}
                      </option>
                    );
                  })}
              </select>
            )}
          </li>
        ))}
      </ul>

      {unassigned.length > 0 && (
        <section aria-labelledby="unassigned">
          <h3 id="unassigned" className="text-xs font-semibold text-ink">
            Meshes not in any part ({unassigned.length})
          </h3>
          <ul className="mt-2 space-y-1.5">
            {unassigned.map((mesh) => (
              <li key={mesh.ref} className="flex items-center gap-2 text-sm">
                <span
                  className={`min-w-0 flex-1 truncate ${mesh.hasName ? 'text-ink-soft' : 'text-ink-muted italic'}`}
                >
                  {mesh.label}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onChange(
                      addPart(config, humanizeName(mesh.label).slice(0, 80) || 'Part', [mesh.ref]),
                    )
                  }
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50 dark:text-brand-200 dark:hover:bg-brand-500/15"
                >
                  <PlusIcon width={12} height={12} /> New part
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
