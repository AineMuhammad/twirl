import 'server-only';

import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth, { type NextAuthConfig } from 'next-auth';
import type { Provider } from 'next-auth/providers';
import Google from 'next-auth/providers/google';
import Resend from 'next-auth/providers/resend';

import { APP_NAME } from '@/config/app';
import { serverEnv } from '@/env/server';
import { sendEmail } from '@/server/email';
import { renderEmail } from '@/server/email-layout';
import { db } from '@/server/db';
import { ensureWorkspace } from '@/server/auth/workspace';

const {
  AUTH_SECRET: secret,
  AUTH_GOOGLE_ID: googleId,
  AUTH_GOOGLE_SECRET: googleSecret,
  RESEND_API_KEY: resendKey,
  EMAIL_FROM: emailFrom,
} = serverEnv;

/** Sign-in needs a secret and a database; without them (CI, demo-only setups) it's off. */
export const authEnabled = Boolean(secret && serverEnv.DATABASE_URL);
export const googleEnabled = Boolean(googleId && googleSecret);
export const emailEnabled = Boolean(resendKey && emailFrom);

function providers(): Provider[] {
  const list: Provider[] = [];
  if (googleId && googleSecret) {
    list.push(
      Google({
        clientId: googleId,
        clientSecret: googleSecret,
        // Google verifies emails, so a Google sign-in may join an account first created with a
        // magic link for the same address.
        allowDangerousEmailAccountLinking: true,
      }),
    );
  }
  if (resendKey && emailFrom) {
    list.push(
      Resend({
        apiKey: resendKey,
        from: emailFrom,
        // Our own branded email instead of Auth.js's default.
        async sendVerificationRequest({ identifier, url }) {
          const sent = await sendEmail({
            to: [identifier],
            subject: `Sign in to ${APP_NAME}`,
            ...renderEmail({
              preheader: `Your sign-in link for ${APP_NAME}.`,
              heading: `Sign in to ${APP_NAME}`,
              paragraphs: [
                'Click the button below to sign in. The link works once and expires in 24 hours.',
              ],
              button: { label: `Sign in to ${APP_NAME}`, url },
              note: 'If you didn’t ask for this, you can ignore this email.',
            }),
          });
          if (!sent) throw new Error('Could not send the sign-in email.');
        },
      }),
    );
  }
  return list;
}

declare module 'next-auth' {
  interface Session {
    user: { id: string; email: string; name?: string | null; image?: string | null };
  }
}

// Built per request so the database client is only created when auth is actually used.
const config = (): NextAuthConfig => ({
  adapter: PrismaAdapter(db()),
  // Database sessions: revocable, and sign-out ends them everywhere.
  session: { strategy: 'database' },
  ...(secret && { secret }),
  providers: providers(),
  pages: { signIn: '/signin', verifyRequest: '/signin/check-email', error: '/signin' },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
  events: {
    // First sign-in: give the new user their own workspace.
    async createUser({ user }) {
      if (user.id && user.email) {
        await ensureWorkspace(db(), { id: user.id, name: user.name ?? null, email: user.email });
      }
    },
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth(config);
