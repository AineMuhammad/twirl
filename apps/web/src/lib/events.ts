import { z } from 'zod';

/** Anonymous shopper events, counted per product. Nothing here identifies a person. */
export const EVENT_TYPES = [
  'view',
  'option_change',
  'share',
  'image_download',
  'quote_request',
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const MAX_EVENTS_PER_BATCH = 50;

export const eventBatchSchema = z.object({
  publicId: z.string().regex(/^[0-9A-Za-z]{6,32}$/),
  versionId: z.string().min(1).max(64).optional(),
  /** Random per visit (one browser tab); not stored anywhere else. */
  sessionId: z.string().regex(/^[0-9a-zA-Z-]{8,64}$/),
  events: z
    .array(
      z.object({
        type: z.enum(EVENT_TYPES),
        /** For option changes: which option (group id). */
        group: z.string().max(64).optional(),
      }),
    )
    .min(1)
    .max(MAX_EVENTS_PER_BATCH),
});
export type EventBatch = z.infer<typeof eventBatchSchema>;
