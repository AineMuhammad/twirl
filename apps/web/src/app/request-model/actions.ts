'use server';

import { after } from 'next/server';
import { headers } from 'next/headers';

import { serverEnv } from '@/env/server';
import { getCurrentUser } from '@/server/auth/session';
import { databaseEnabled, db } from '@/server/db';
import { sendEmail } from '@/server/email';
import { renderEmail } from '@/server/email-layout';
import { createModelRequest } from '@/server/model-requests';
import { underLimit } from '@/server/rate-limit';

export type ModelRequestState = { ok?: boolean; error?: string };

/** Saves a modelling request and emails the admins. Public, so rate limited and validated. */
export async function submitModelRequest(
  _state: ModelRequestState,
  formData: FormData,
): Promise<ModelRequestState> {
  if (!databaseEnabled) return { error: 'Requests are not available right now.' };
  const limit = await underLimit('model', await headers());
  if (!limit.ok) return { error: 'Too many requests. Please try again later.' };

  const user = await getCurrentUser();
  const membership = user
    ? await db().membership.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
        select: { workspaceId: true },
      })
    : null;
  const field = (name: string) => {
    const value = formData.get(name);
    return typeof value === 'string' && value !== '' ? value : undefined;
  };
  const result = await createModelRequest(
    db(),
    {
      name: field('name'),
      email: field('email'),
      company: field('company'),
      description: field('description'),
      links: field('links'),
      website: field('website'),
    },
    membership?.workspaceId ?? null,
  );
  if (!result.ok) return { error: result.error };

  const request = result.request;
  if (request) {
    const admins = (serverEnv.ADMIN_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);
    const company = field('company');
    const description = field('description') ?? '';
    const links = (field('links') ?? '').trim();
    after(async () => {
      await sendEmail({
        to: admins,
        replyTo: request.email,
        subject: `3D model request from ${request.name}${company ? ` (${company})` : ''}`,
        ...renderEmail({
          preheader: `${request.name} needs a 3D model made.`,
          heading: '3D model request',
          paragraphs: [description],
          rows: [
            ['From', `${request.name} <${request.email}>`],
            ...(company ? ([['Company', company]] as [string, string][]) : []),
            ...links
              .split(/\n+/)
              .filter(Boolean)
              .map((l, i) => [`Link ${i + 1}`, l.trim()] as [string, string]),
          ],
          note: 'See all requests in the admin panel. Reply to this email to answer them.',
        }),
      });
    });
  }
  return { ok: true };
}
