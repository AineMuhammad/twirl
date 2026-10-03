import { z } from 'zod';

import { MAX_MODEL_BYTES } from '@/config/limits';

/** Content types for the model files we accept, by extension. */
export const MODEL_TYPES = {
  glb: 'model/gltf-binary',
  gltf: 'model/gltf+json',
} as const;

export const uploadRequestSchema = z.object({
  filename: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .regex(/\.(glb|gltf)$/i, 'Upload a .glb or .gltf file.'),
  size: z
    .number()
    .int()
    .positive('This file is empty.')
    .max(MAX_MODEL_BYTES, 'Models can be up to 15 MB.'),
});

export type UploadRequest = z.infer<typeof uploadRequestSchema>;

export function modelTypeFor(filename: string): string {
  return filename.toLowerCase().endsWith('.gltf') ? MODEL_TYPES.gltf : MODEL_TYPES.glb;
}

/** A filename that's safe in an object key and a URL: `My Sofa (v2).glb` → `my-sofa-v2.glb`. */
export function safeFilename(filename: string): string {
  const match = /^(.*?)(\.[a-z0-9]+)?$/i.exec(filename.trim());
  const base = (match?.[1] ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  const ext = (match?.[2] ?? '').toLowerCase();
  return `${base || 'model'}${ext}`;
}

/** Object key for an asset: scoped by workspace, unguessable via the asset id. */
export function assetKey(workspaceId: string, assetId: string, filename: string): string {
  return `workspaces/${workspaceId}/assets/${assetId}/${safeFilename(filename)}`;
}

export type UploadCheck = { ok: true } | { ok: false; reason: string };

/** Compares what landed in storage with what was declared when the upload started. */
export function checkUploaded(
  declared: { size: number; mimeType: string },
  stored: { size: number; contentType: string } | null,
): UploadCheck {
  if (!stored) return { ok: false, reason: 'The file never arrived. Please upload it again.' };
  if (stored.size !== declared.size) {
    return { ok: false, reason: "The uploaded file's size doesn't match. Please upload it again." };
  }
  if (stored.size > MAX_MODEL_BYTES) return { ok: false, reason: 'Models can be up to 15 MB.' };
  if (stored.contentType !== declared.mimeType) {
    return { ok: false, reason: "The uploaded file's type doesn't match. Please upload it again." };
  }
  return { ok: true };
}
