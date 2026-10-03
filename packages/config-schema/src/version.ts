/**
 * Current version of the product configuration document.
 * Bump it alongside a migration whenever the config shape changes.
 */
export const CURRENT_SCHEMA_VERSION = 1;

export function isSupportedSchemaVersion(version: unknown): version is number {
  return (
    Number.isInteger(version) &&
    (version as number) >= 1 &&
    (version as number) <= CURRENT_SCHEMA_VERSION
  );
}
