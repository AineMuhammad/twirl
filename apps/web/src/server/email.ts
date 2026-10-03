import 'server-only';

import { serverEnv } from '@/env/server';

/** Whether email can be sent (Resend key and sender configured). */
export const emailEnabled = Boolean(serverEnv.RESEND_API_KEY && serverEnv.EMAIL_FROM);

/**
 * Sends one email through Resend's API. Returns false (and logs) on failure: emails are
 * notifications, so callers carry on without them.
 */
export async function sendEmail(message: {
  to: string[];
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}): Promise<boolean> {
  if (!emailEnabled || message.to.length === 0) return false;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serverEnv.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: serverEnv.EMAIL_FROM,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
        ...(message.replyTo && { reply_to: message.replyTo }),
      }),
    });
    if (!response.ok) {
      console.error('[email] Resend rejected the message', response.status, await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error('[email] sending failed', error);
    return false;
  }
}

/** Escapes text for HTML email bodies. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
