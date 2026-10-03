import { z } from 'zod';

/** Stable identifier used to reference parts, groups, options and rules: `seat-fabric`, `brass`. */
export const idSchema = z
  .string()
  .regex(/^[a-z0-9][a-z0-9_-]{0,63}$/, 'Use 1–64 lowercase letters, digits, "-" or "_".');

/** CSS hex colour, normalised to lowercase `#rrggbb`. */
export const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Use a hex colour like #1a2b3c.')
  .transform((hex) => hex.toLowerCase());

/** Money in integer minor units (cents) to avoid floating-point rounding. May be negative. */
export const moneySchema = z.number().int('Prices are whole minor units (cents).');

/** ISO 4217 currency code. */
export const currencySchema = z.string().regex(/^[A-Z]{3}$/, 'Use a 3-letter ISO currency code.');

/** Shopper-facing text with sensible limits. */
export const labelSchema = z.string().trim().min(1).max(80);
