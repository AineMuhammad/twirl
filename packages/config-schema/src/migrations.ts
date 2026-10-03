import type { ZodError } from 'zod';

import { type ProductConfig, productConfigSchema } from './config';
import { CURRENT_SCHEMA_VERSION } from './version';

type RawConfig = Record<string, unknown>;

/** Upgrades a config of version n to version n + 1 (returning a new object). */
export type Migration = (config: RawConfig) => RawConfig;

/**
 * MIGRATIONS[n] upgrades a version-n config to n + 1. Add one with every schema change and bump
 * CURRENT_SCHEMA_VERSION; published versions are stored as-is and upgraded when read, so old
 * share links keep working.
 */
export const MIGRATIONS: Readonly<Record<number, Migration>> = {};

export class ConfigVersionError extends Error {
  override name = 'ConfigVersionError';
}

/** Runs migrations until the config is at the current version. Doesn't validate the result. */
export function migrateConfig(
  input: unknown,
  migrations: Readonly<Record<number, Migration>> = MIGRATIONS,
  current: number = CURRENT_SCHEMA_VERSION,
): { config: RawConfig; migratedFrom: number | null } {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new ConfigVersionError('A product config must be an object.');
  }
  let config = input as RawConfig;
  const from = config.schemaVersion;
  if (typeof from !== 'number' || !Number.isInteger(from) || from < 1) {
    throw new ConfigVersionError('The config has no valid schemaVersion.');
  }
  if (from > current) {
    throw new ConfigVersionError(
      `This config uses schema version ${from}, newer than supported (${current}). Update the app.`,
    );
  }
  for (let version = from; version < current; version++) {
    const migrate = migrations[version];
    if (!migrate) throw new ConfigVersionError(`No migration from schema version ${version}.`);
    config = { ...migrate(config), schemaVersion: version + 1 };
  }
  return { config, migratedFrom: from === current ? null : from };
}

export type ParseConfigResult =
  | { success: true; data: ProductConfig; migratedFrom: number | null }
  | { success: false; error: ConfigVersionError | ZodError };

/** Migrates a stored config to the current version, then validates it. */
export function parseProductConfig(input: unknown): ParseConfigResult {
  let migrated: ReturnType<typeof migrateConfig>;
  try {
    migrated = migrateConfig(input);
  } catch (error) {
    if (error instanceof ConfigVersionError) return { success: false, error };
    throw error;
  }
  const result = productConfigSchema.safeParse(migrated.config);
  return result.success
    ? { success: true, data: result.data, migratedFrom: migrated.migratedFrom }
    : { success: false, error: result.error };
}
