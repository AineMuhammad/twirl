'use server';

import { z } from 'zod';

import { PLANS } from '@/config/plans';
import { serverEnv } from '@/env/server';
import { Plan } from '@/generated/prisma/enums';
import { requireWorkspace } from '@/server/auth/session';
import { sendEmail } from '@/server/email';
import { renderEmail } from '@/server/email-layout';

export type UpgradeState = { ok?: boolean; error?: string };

const schema = z.object({ plan: z.enum([Plan.STARTER, Plan.PRO]) });

/** Emails the admins that a workspace wants to upgrade (no checkout in v1). */
export async function requestUpgrade(
  _state: UpgradeState,
  formData: FormData,
): Promise<UpgradeState> {
  const { user, workspace } = await requireWorkspace('/pricing');
  const parsed = schema.safeParse({ plan: formData.get('plan') });
  if (!parsed.success) return { error: 'Choose a plan.' };
  const wanted = PLANS[parsed.data.plan].label;
  const admins = (serverEnv.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  const sent = await sendEmail({
    to: admins,
    replyTo: user.email,
    subject: `Upgrade request: ${workspace.name} → ${wanted}`,
    ...renderEmail({
      preheader: `${user.email} wants ${wanted}.`,
      heading: `Upgrade request: ${wanted}`,
      paragraphs: [
        `${user.name ?? user.email} asked to move “${workspace.name}” from ${PLANS[workspace.plan].label} to ${wanted}.`,
      ],
      rows: [
        ['Requested by', user.email],
        ['Workspace', workspace.name],
        ['Current plan', PLANS[workspace.plan].label],
        ['Workspace id', workspace.id],
      ],
      note: 'Set the plan in the admin panel. Reply to this email to answer them.',
    }),
  });
  if (!sent) return { error: 'We couldn’t send your request. Please try again later.' };
  return { ok: true };
}
