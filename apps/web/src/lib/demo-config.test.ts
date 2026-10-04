import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { parseProductConfig } from '@twirl/config-schema';
import { describe, expect, it } from 'vitest';

import {
  HOSTED_SAMPLES_VERSION,
  hostedSampleUrl,
  SAMPLE_CATEGORIES,
  SAMPLE_MODELS,
} from './demo-config';
import manifest from './sample-manifest.json';

const samplesDir = fileURLToPath(new URL('../../public/samples/', import.meta.url));
const hosted: Record<string, { bytes: number; sha256: string; nodes: string[] }> = manifest.files;

/** Node names in a GLB, read from its JSON chunk (no 3D library needed). */
function glbNodeNames(file: string): string[] {
  const buf = readFileSync(file);
  expect(buf.readUInt32LE(0)).toBe(0x46546c67); // 'glTF'
  const jsonLength = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLength).toString('utf8')) as {
    nodes?: { name?: string }[];
  };
  return (json.nodes ?? []).map((n) => n.name ?? '');
}

const fileOf = (url: string) => url.split('/').pop() ?? '';

describe('demo samples', () => {
  it('have unique ids and urls, and use known categories', () => {
    expect(new Set(SAMPLE_MODELS.map((m) => m.id)).size).toBe(SAMPLE_MODELS.length);
    expect(new Set(SAMPLE_MODELS.map((m) => m.url)).size).toBe(SAMPLE_MODELS.length);
    for (const m of SAMPLE_MODELS) expect(SAMPLE_CATEGORIES).toContain(m.category);
  });

  it('serve hosted files from the manifest version folder', () => {
    expect(HOSTED_SAMPLES_VERSION).toBe(manifest.version);
    expect(hostedSampleUrl('a.glb', 'https://assets.example')).toBe(
      `https://assets.example/samples/${manifest.version}/a.glb`,
    );
    expect(hostedSampleUrl('a.glb', undefined)).toBe('/samples/a.glb');
  });

  describe.each(SAMPLE_MODELS)('$id', (sample) => {
    const file = fileOf(sample.url);

    it('references only nodes that exist in its model', () => {
      const parsed = parseProductConfig(sample.config);
      if (!parsed.success) throw parsed.error;
      // Hosted models are checked against the manifest (their files aren't in git); models that
      // ship with the app are read directly.
      const names = new Set(hosted[file]?.nodes ?? glbNodeNames(`${samplesDir}${file}`));
      const referenced = [
        ...parsed.data.parts.flatMap((p) => p.meshes),
        ...parsed.data.hiddenMeshes,
      ].filter((m) => !m.startsWith('#'));
      expect(referenced.filter((m) => !names.has(m))).toEqual([]);
    });

    it.runIf(hosted[file] && existsSync(`${samplesDir}${file}`))(
      'matches the manifest when built locally',
      () => {
        const bytes = readFileSync(`${samplesDir}${file}`);
        expect(createHash('sha256').update(bytes).digest('hex')).toBe(hosted[file]?.sha256);
      },
    );
  });
});
