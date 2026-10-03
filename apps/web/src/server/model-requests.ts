import { z } from 'zod';

import type { PrismaClient } from '@/generated/prisma/client';
import type { ModelRequestStatus } from '@/generated/prisma/enums';

/** Requests for the 3D-modelling service. Visible to admins only. */

const MAX_LINKS = 10;

export const modelRequestSchema = z.object({
  name: z.string().trim().min(1, 'Please enter your name.').max(100),
  email: z.email('Please enter a valid email address.').max(254),
  company: z.string().trim().max(120).optional(),
  description: z
    .string()
    .trim()
    .min(10, 'Tell us a little about the product (at least 10 characters).')
    .max(3000),
  /** One link per line (product pages, photos, drawings). */
  links: z.string().max(3000).optional(),
  /** Honeypot: hidden from people. */
  website: z.string().max(200).optional(),
});

/** Splits pasted links into valid http(s) URLs (at most 10); returns null if any is invalid. */
export function parseLinks(text: string | undefined): string[] | null {
  const lines = (text ?? '')
    .split(/[\n,]+/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length > MAX_LINKS) return null;
  for (const line of lines) {
    try {
      const url = new URL(line);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    } catch {
      return null;
    }
  }
  return lines;
}

export type CreateModelRequestResult =
  | { ok: true; request: { id: string; name: string; email: string } | null }
  | { ok: false; error: string };

export async function createModelRequest(
  db: PrismaClient,
  input: unknown,
  workspaceId: string | null,
): Promise<CreateModelRequestResult> {
  const parsed = modelRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Please check the form.' };
  }
  const data = parsed.data;
  if (data.website) return { ok: true, request: null };
  const links = parseLinks(data.links);
  if (!links) {
    return { ok: false, error: `Use up to ${MAX_LINKS} full links starting with https://.` };
  }
  const request = await db.modelRequest.create({
    data: {
      workspaceId,
      name: data.name,
      email: data.email.toLowerCase(),
      company: data.company || null,
      description: data.description,
      links,
    },
    select: { id: true, name: true, email: true },
  });
  return { ok: true, request };
}

export function listModelRequests(db: PrismaClient, status?: ModelRequestStatus) {
  return db.modelRequest.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { workspace: { select: { name: true } } },
  });
}

export async function setModelRequestStatus(
  db: PrismaClient,
  id: string,
  status: ModelRequestStatus,
) {
  const updated = await db.modelRequest.updateMany({ where: { id }, data: { status } });
  return updated.count > 0;
}
