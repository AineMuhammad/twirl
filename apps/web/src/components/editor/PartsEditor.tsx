'use client';

import type { ProductConfig } from '@twirl/config-schema/engine';

import type { ConfigIssue } from '@/server/products';

import {
  type MeshChoice,
  partForMesh,
  removePart,
  renamePart,
  setAllCustomisable,
  setMeshCustomisable,
} from './config-edit';
import { AlertIcon } from './icons';
import { Badge, Button, Callout, controlClass, InfoTip, SectionHeader } from './ui';

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
 * Step 2: choose which pieces of the model shoppers can customise, and name them. Every piece of
 * the 3D file is listed once; ticked pieces become parts that options can target.
 */
export function PartsEditor({ config, meshes, issues, onChange, onHighlight }: PartsEditorProps) {
  const header = (
    <SectionHeader
      title="Customisable parts"
      description="Tick the pieces of your model that shoppers can customise and give each a name they'll understand. Unticked pieces always look exactly as in your file."
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
  const selectedCount = meshes.filter((m) => partForMesh(config, m.ref)).length;
  // Parts pointing at pieces the model doesn't have (e.g. after a re-export).
  const orphaned = config.parts.filter((p) => p.meshes.every((m) => !known.has(m)));

  return (
    <div className="space-y-5 p-6">
      {header}

      <div className="flex items-center justify-between gap-3 rounded-xl bg-tint px-4 py-3">
        <p className="text-[14px] text-ink">
          <span className="font-semibold tabular-nums">{selectedCount}</span> of{' '}
          <span className="tabular-nums">{meshes.length}</span> pieces customisable
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={selectedCount === meshes.length}
            onClick={() => onChange(setAllCustomisable(config, meshes, true))}
          >
            Select all
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={selectedCount === 0}
            title="Untick every piece. Options that only used them are removed too."
            onClick={() => onChange(setAllCustomisable(config, meshes, false))}
          >
            Clear all
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[13px] text-ink-muted">
        Hover a row to see that piece highlighted in the preview.
        <InfoTip label="About pieces">
          Pieces are the separate objects inside your 3D file, listed under the names your 3D tool
          gave them. Pieces with the same name are listed once and change together.
        </InfoTip>
      </div>

      <ul
        className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface"
        aria-label="Pieces of your model"
      >
        {meshes.map((mesh, index) => {
          const part = partForMesh(config, mesh.ref);
          const partIndex = part ? config.parts.indexOf(part) : -1;
          const partIssues = issues.filter((i) => i.path.startsWith(`parts.${partIndex}`));
          const usedBy = part
            ? config.groups.filter((g) =>
                g.type === 'dimension'
                  ? g.behaviors.some((b) => b.part === part.id)
                  : g.parts.includes(part.id),
              )
            : [];
          const checkboxId = `piece-${index}`;
          return (
            <li
              key={mesh.ref}
              onMouseEnter={() => onHighlight(mesh.nodeId)}
              onMouseLeave={() => onHighlight(null)}
              className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-brand-50/40 dark:hover:bg-brand-500/5 ${part ? '' : 'bg-tint/30'}`}
            >
              <input
                id={checkboxId}
                type="checkbox"
                checked={Boolean(part)}
                onChange={(e) =>
                  onChange(setMeshCustomisable(config, mesh, e.target.checked, index))
                }
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
                    placeholder="Name this part"
                    onChange={(e) => onChange(renamePart(config, part.id, e.target.value))}
                    onFocus={() => onHighlight(mesh.nodeId)}
                    onBlur={() => onHighlight(null)}
                  />
                ) : (
                  <label
                    htmlFor={checkboxId}
                    className="flex h-10 cursor-pointer items-center text-[15px] text-ink-muted"
                  >
                    Not customisable
                  </label>
                )}
                <p id={`${checkboxId}-file`} className="mt-1 text-[13px] text-ink-muted">
                  In your file:{' '}
                  <span className={mesh.hasName ? 'text-ink-soft' : 'italic'}>
                    {mesh.hasName ? mesh.label : 'unnamed piece'}
                  </span>
                </p>
                {part && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {usedBy.length === 0 ? (
                      <span className="text-[13px] text-ink-faint">Not in any option yet</span>
                    ) : (
                      <>
                        <span className="text-[13px] text-ink-muted">Used in</span>
                        {usedBy.map((g) => (
                          <Badge key={g.id}>{g.label}</Badge>
                        ))}
                      </>
                    )}
                  </div>
                )}
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
            <AlertIcon /> {orphaned.length} part{orphaned.length === 1 ? '' : 's'} no longer match
            your model
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
                  Remove part
                </Button>
              </li>
            ))}
          </ul>
        </Callout>
      )}
    </div>
  );
}
