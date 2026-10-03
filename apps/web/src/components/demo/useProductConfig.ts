'use client';

import type { ProductConfig, ProductConfigInput } from '@twirl/config-schema';
import type { MeshTreeNode } from '@twirl/viewer';
import { useEffect, useState } from 'react';

/** What to build the config from: a saved config, or a model's mesh tree (uploads). */
export type ConfigSource =
  | { kind: 'saved'; key: string; input: ProductConfigInput }
  | { kind: 'starter'; key: string; name: string; meshTree: MeshTreeNode[] };

/**
 * Parses (or generates) the product config in a lazily loaded chunk, so the schema library
 * stays out of the page's initial JavaScript. Returns null until it's ready.
 */
export function useProductConfig(source: ConfigSource | null): ProductConfig | null {
  const [result, setResult] = useState<{ key: string; config: ProductConfig } | null>(null);

  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    void import('@twirl/config-schema').then((schema) => {
      if (cancelled) return;
      if (source.kind === 'starter') {
        const config = schema.starterConfig({ name: source.name, meshTree: source.meshTree });
        setResult({ key: source.key, config });
        return;
      }
      const parsed = schema.parseProductConfig(source.input);
      if (parsed.success) setResult({ key: source.key, config: parsed.data });
      else console.error('[demo] invalid product config', parsed.error);
    });
    return () => {
      cancelled = true;
    };
  }, [source]);

  return source && result?.key === source.key ? result.config : null;
}
