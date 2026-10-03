'use client';

import type { ProductConfig } from '@twirl/config-schema/engine';

import type { ConfigIssue } from '@/server/products';

import {
  addPart,
  isMeshShown,
  type MeshChoice,
  meshPartName,
  partForMesh,
  removePart,
  renamePart,
  setAllShown,
  setMeshShown,
} from './config-edit';
import { AlertIcon } from './icons';
import { Button, Callout, controlClass, SectionHeader } from './ui';

export interface PartsEditorProps {
  config: ProductConfig;
  /** The model's pieces, or null while it loads. */
  meshes: MeshChoice[] | null;
  issues: ConfigIssue[];
  onChange: (config: ProductConfig) => void;
  /** Highlight a node in the preview while hovering its row. */
  onHighlight: (nodeId: string | null) => void;
}

/**
 * Step 2: choose which pieces of the 3D file are part of the product, and name them. Every piece
 * is listed once; unticked pieces are hidden from the model everywhere.
 */
export function PartsEditor({ config, meshes, issues, onChange, onHighlight }: PartsEditorProps) {
  const header = (
    <SectionHeader
      title="Parts"
      description="Untick parts you don't want shoppers to see. Give the rest names shoppers will understand."
    />
  );
  if (!meshes) {
    return (
      <div className="space-y-5 p-6">
        {header}
        <div className="space-y-2" aria-busy aria-label="Loading your model">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-tint" />
          ))}
        </div>
      </div>
    );
  }

  const known = new Set(meshes.map((m) => m.ref));
  const shownCount = meshes.filter((m) => isMeshShown(config, m.ref)).length;
  // Parts pointing at pieces the model doesn't have (e.g. after a re-export).
  const orphaned = config.parts.filter((p) => p.meshes.every((m) => !known.has(m)));

  return (
    <div className="space-y-5 p-6">
      {header}

      <div className="flex items-center justify-between gap-3 rounded-xl bg-tint px-4 py-3">
        <p className="text-[14px] text-ink">
          <span className="font-semibold tabular-nums">{shownCount}</span> of{' '}
          <span className="tabular-nums">{meshes.length}</span> parts shown
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={shownCount === meshes.length}
            onClick={() => onChange(setAllShown(config, meshes, true))}
          >
            Show all
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={shownCount === 0}
            title="Hides every part and removes their options"
            onClick={() => onChange(setAllShown(config, meshes, false))}
          >
            Hide all
          </Button>
        </div>
      </div>

      <ul
        className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface"
        aria-label="Parts of your model"
      >
        {meshes.map((mesh, index) => {
          const shown = isMeshShown(config, mesh.ref);
          const part = partForMesh(config, mesh.ref);
          const partIndex = part ? config.parts.indexOf(part) : -1;
          const partIssues = issues.filter((i) => i.path.startsWith(`parts.${partIndex}`));
          const checkboxId = `piece-${index}`;
          return (
            <li
              key={mesh.ref}
              onMouseEnter={() => onHighlight(mesh.nodeId)}
              onMouseLeave={() => onHighlight(null)}
              className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-brand-50/40 dark:hover:bg-brand-500/5 ${shown ? '' : 'bg-tint/40'}`}
            >
              <input
                id={checkboxId}
                type="checkbox"
                checked={shown}
                aria-label={`Show ${mesh.label} in the product`}
                onChange={(e) => onChange(setMeshShown(config, mesh, e.target.checked, index))}
                className="mt-3 size-[18px] shrink-0 cursor-pointer accent-brand-600"
                aria-describedby={`${checkboxId}-file`}
              />
              <div className="min-w-0 flex-1">
                {part ? (
                  <input
                    aria-label={`Name shoppers see for ${mesh.label}`}
                    className={`${controlClass} font-medium ${part.label.trim() ? '' : 'border-red-400'}`}
                    value={part.label}
                    maxLength={80}
                    placeholder="Part name"
                    onChange={(e) => onChange(renamePart(config, part.id, e.target.value))}
                    onFocus={() => onHighlight(mesh.nodeId)}
                    onBlur={() => onHighlight(null)}
                  />
                ) : shown ? (
                  <Button
                    size="sm"
                    onClick={() => onChange(addPart(config, meshPartName(mesh, index), [mesh.ref]))}
                  >
                    Add a name
                  </Button>
                ) : (
                  <label
                    htmlFor={checkboxId}
                    className="flex h-10 cursor-pointer items-center text-[15px] text-ink-muted line-through decoration-ink-faint"
                  >
                    Hidden
                  </label>
                )}
                <p id={`${checkboxId}-file`} className="mt-1 text-[13px] text-ink-muted">
                  Original name:{' '}
                  <span className={mesh.hasName ? 'text-ink-soft' : 'italic'}>
                    {mesh.hasName ? mesh.label : 'none'}
                  </span>
                </p>
                {partIssues.map((issue) => (
                  <p
                    key={issue.message}
                    className="mt-1.5 text-[13px] text-red-600 dark:text-red-400"
                  >
                    {issue.message}
                  </p>
                ))}
              </div>
            </li>
          );
        })}
      </ul>

      {orphaned.length > 0 && (
        <Callout tone="warning">
          <p className="flex items-center gap-2 font-medium">
            <AlertIcon /> {orphaned.length} part{orphaned.length === 1 ? ' is' : 's are'} missing
            from your model
          </p>
          <ul className="mt-2 space-y-1.5">
            {orphaned.map((part) => (
              <li key={part.id} className="flex items-center justify-between gap-3">
                <span>{part.label}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onChange(removePart(config, part.id))}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        </Callout>
      )}
    </div>
  );
}
