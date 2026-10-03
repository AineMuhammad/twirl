import { z } from 'zod';

import { hexColorSchema } from './primitives';
import type { SelectionValue, Selections } from './selections';

/** Zod versions of the selection types, for validating requests (e.g. saved configurations). */
export const selectionValueSchema = z.union([
  z.string(),
  z.boolean(),
  z.number(),
  z.object({ custom: hexColorSchema }).strict(),
]) satisfies z.ZodType<SelectionValue>;

export const selectionsSchema = z.record(
  z.string(),
  selectionValueSchema,
) satisfies z.ZodType<Selections>;
