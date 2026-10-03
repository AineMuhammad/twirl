'use server';

import { headers } from 'next/headers';
import { z } from 'zod';

import { serverEnv } from '@/env/server';
import { sendEmail } from '@/server/email';
import { renderEmail } from '@/server/email-layout';
import { underLimit } from '@/server/rate-limit';

import { CONTACT_TOPICS } from './topics';

export type ContactState = { ok?: boolean; error?: string };

const schema = z.object({
  name: z.string().trim().min(1, 'Please enter your name.').max(100),
  email: z.email('Please enter a valid email address.').max(254),
  topic: z.enum(CONTACT_TOPICS),
  message: z
    .string()
    .trim()
    .min(10, 'Please write a little more (at least 10 characters).')
    .max(4000),
  website: z.string().max(200).optional(),
});

/** Emails a contact-form message to the team. Public, so rate limited and validated. */
export async function sendContactMessage(
  _state: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const limit = await underLimit('contact', await headers());
  if (!limit.ok) return { error: 'Too many messages. Please try again later.' };
  const value = (name: string) => {
    const v = formData.get(name);
    return typeof v === 'string' && v !== '' ? v : undefined;
  };
  const parsed = schema.safeParse({
    name: value('name'),
    email: value('email'),
    topic: value('topic'),
    message: value('message'),
    website: value('website'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check the form.' };
  }
  const data = parsed.data;
  if (data.website) return { ok: true };
  const to = (serverEnv.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  const sent = await sendEmail({
    to,
    replyTo: data.email,
    subject: `${data.topic}: message from ${data.name}`,
    ...renderEmail({
      preheader: `${data.name} sent a message about ${data.topic.toLowerCase()}.`,
      heading: `New message: ${data.topic}`,
      paragraphs: [data.message],
      rows: [
        ['From', `${data.name} <${data.email}>`],
        ['Topic', data.topic],
      ],
      note: 'Reply to this email to answer them.',
    }),
  });
  if (!sent) return { error: 'We couldn’t send your message. Please try again later.' };
  return { ok: true };
}
