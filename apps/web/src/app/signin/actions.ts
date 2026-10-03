'use server';

import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { signIn } from '@/auth';
import { safeReturnPath } from '@/server/auth/redirect';

const emailSchema = z.object({
  email: z.email().max(254),
  callbackUrl: z.string().optional(),
});

/** Auth.js signals success with a redirect, so only its own errors are caught here. */
async function withAuthErrors(run: () => Promise<unknown>, returnTo: string) {
  try {
    await run();
  } catch (error) {
    if (error instanceof AuthError) {
      console.error('[auth] sign-in failed', error.type);
      redirect(
        `/signin?error=${encodeURIComponent(error.type)}&callbackUrl=${encodeURIComponent(returnTo)}`,
      );
    }
    throw error;
  }
}

export async function signInWithGoogle(formData: FormData) {
  const returnTo = safeReturnPath(formData.get('callbackUrl'));
  await withAuthErrors(() => signIn('google', { redirectTo: returnTo }), returnTo);
}

export type EmailSignInState = { error?: string };

export async function signInWithEmail(
  _state: EmailSignInState,
  formData: FormData,
): Promise<EmailSignInState> {
  const parsed = emailSchema.safeParse({
    email: formData.get('email'),
    callbackUrl: formData.get('callbackUrl') ?? undefined,
  });
  if (!parsed.success) return { error: 'Enter a valid email address.' };
  const returnTo = safeReturnPath(parsed.data.callbackUrl);
  await withAuthErrors(
    () => signIn('resend', { email: parsed.data.email.toLowerCase(), redirectTo: returnTo }),
    returnTo,
  );
  return {};
}
