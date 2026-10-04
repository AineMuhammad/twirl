import { describeSelections, evaluate, formatPrice } from '@twirl/config-schema';
import { z } from 'zod';

import type { Prisma, PrismaClient } from '@/generated/prisma/client';
import type { QuoteStatus } from '@/generated/prisma/enums';

import { workspaceNotLocked } from './plans';
import { validateConfig } from './products';
import { MAX_SELECTIONS_BYTES } from './shares';

/**
 * Quote requests: shoppers send their design and contact details. The price is always computed
 * here from the published version; the shopper's browser never decides it. Quotes are personal
 * data: they're only read through workspace-scoped queries.
 */

export const quoteRequestSchema = z.object({
  publicId: z.string().regex(/^[0-9A-Za-z]{6,32}$/),
  versionId: z.string().min(1).max(64),
  selections: z.record(z.string(), z.unknown()),
  name: z.string().trim().min(1, 'Please enter your name.').max(100),
  email: z.email('Please enter a valid email address.').max(254),
  phone: z.string().trim().max(40).optional(),
  message: z.string().trim().max(2000).optional(),
  /** Honeypot: hidden from people, so only bots fill it in. */
  website: z.string().max(200).optional(),
});

export type CreateQuoteResult =
  { ok: true; quote: QuoteForEmail | null } | { ok: false; error: string };

export interface QuoteForEmail {
  id: string;
  workspaceId: string;
  productName: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  price: string;
  lines: { label: string; value: string }[];
}

export async function createQuote(db: PrismaClient, input: unknown): Promise<CreateQuoteResult> {
  const parsed = quoteRequestSchema.safeParse(input);
  if (!parsed.success) {
    const contact = parsed.error.issues.find((i) =>
      ['name', 'email', 'phone', 'message'].includes(String(i.path[0])),
    );
    return { ok: false, error: contact?.message ?? 'Please check the form and try again.' };
  }
  const data = parsed.data;
  // Bots fill every field; pretend it worked so they don't adapt.
  if (data.website) return { ok: true, quote: null };
  if (JSON.stringify(data.selections).length > MAX_SELECTIONS_BYTES) {
    return { ok: false, error: 'Please check the form and try again.' };
  }

  const version = await db.productVersion.findFirst({
    where: {
      id: data.versionId,
      status: 'PUBLISHED',
      product: {
        publicId: data.publicId,
        archivedAt: null,
        publishedVersionId: { not: null },
        workspace: workspaceNotLocked(),
      },
    },
    select: {
      id: true,
      config: true,
      product: { select: { id: true, workspaceId: true } },
    },
  });
  if (!version) return { ok: false, error: 'This product is not available.' };
  const config = validateConfig(version.config);
  if (!config.ok) return { ok: false, error: 'This product is not available.' };

  const evaluation = evaluate(config.config, data.selections);
  const quote = await db.quoteRequest.create({
    data: {
      workspaceId: version.product.workspaceId,
      productId: version.product.id,
      versionId: version.id,
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone || null,
      message: data.message || null,
      selections: evaluation.selections as Prisma.InputJsonObject,
      priceTotal: evaluation.price.total,
      currency: evaluation.price.currency,
    },
    select: { id: true, name: true, email: true, phone: true, message: true },
  });
  return {
    ok: true,
    quote: {
      ...quote,
      workspaceId: version.product.workspaceId,
      productName: config.config.product.name,
      price: formatPrice(evaluation.price.total, evaluation.price.currency),
      lines: describeSelections(config.config, evaluation.selections).map(({ label, value }) => ({
        label,
        value,
      })),
    },
  };
}

/** Emails of everyone who should hear about a workspace's quotes (v1: its owners). */
export async function workspaceOwnerEmails(db: PrismaClient, workspaceId: string) {
  const owners = await db.membership.findMany({
    where: { workspaceId, role: 'OWNER' },
    select: { user: { select: { email: true } } },
  });
  return owners.map((o) => o.user.email);
}

export function listQuotes(
  db: PrismaClient,
  workspaceId: string,
  status: 'open' | 'ARCHIVED' = 'open',
) {
  return db.quoteRequest.findMany({
    where: {
      workspaceId,
      status: status === 'open' ? { in: ['NEW', 'READ'] } : 'ARCHIVED',
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      priceTotal: true,
      currency: true,
      status: true,
      createdAt: true,
      product: { select: { name: true } },
    },
  });
}

export function countNewQuotes(db: PrismaClient, workspaceId: string) {
  return db.quoteRequest.count({ where: { workspaceId, status: 'NEW' } });
}

/** One quote with everything needed to show it, or null if it isn't in this workspace. */
export async function getQuote(db: PrismaClient, workspaceId: string, id: string) {
  const quote = await db.quoteRequest.findFirst({
    where: { id, workspaceId },
    include: {
      product: { select: { id: true, name: true, publicId: true } },
      version: { select: { number: true, config: true } },
    },
  });
  if (!quote) return null;
  const config = validateConfig(quote.version.config);
  const selections = (quote.selections ?? {}) as Record<string, never>;
  return {
    quote,
    lines: config.ok ? describeSelections(config.config, selections) : [],
    breakdown: config.ok ? evaluate(config.config, selections).price.lines : [],
  };
}

export async function setQuoteStatus(
  db: PrismaClient,
  workspaceId: string,
  id: string,
  status: QuoteStatus,
) {
  const updated = await db.quoteRequest.updateMany({
    where: { id, workspaceId },
    data: { status },
  });
  return updated.count > 0;
}
