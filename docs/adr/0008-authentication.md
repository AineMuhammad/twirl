# 0008. Authentication and authorization

- **Status:** Accepted
- **Date:** 2026-10-03

## Context

Merchants sign in to manage products. The spec calls for Auth.js with Google and email magic
links, a workspace created automatically on first sign-in, and authorization checks on every
workspace-scoped query.

## Decision

1. **Auth.js v5 (`next-auth@5` beta) with the Prisma adapter.** v5 is the current Auth.js line
   and supports Next.js 16. v4 is the legacy NextAuth API.
2. **Providers:** Google OAuth and email magic links sent through Resend. Google sign-ins may
   link to an existing account with the same email (`allowDangerousEmailAccountLinking`). This
   is acceptable because Google verifies emails, and it avoids "use your other sign-in method"
   dead ends.
3. **Database sessions,** not JWTs. They can be revoked, and sign-out ends the session on the
   server.
4. **The workspace is created on first sign-in.** The adapter's `createUser` event calls
   `ensureWorkspace`. `requireWorkspace` calls it again, so a user who somehow has no workspace
   gets one. It takes a per-user advisory lock, so concurrent first requests create exactly
   one.
5. **Authorization goes through one module** (`src/server/auth/session.ts`):
   - `requireUser()` redirects to sign-in, with a return path that must be same-site.
   - `requireWorkspace()` returns the user's workspace; queries filter by its id.
   - `assertMember()` checks any workspace id that comes from a request.
   - Admins are the emails in `ADMIN_EMAILS`.
6. **Sign-in is optional where it isn't configured:**
   - Locally and in CI, missing auth variables turn sign-in off and the public pages still
     work.
   - On Vercel (`VERCEL_ENV` preview/production), the auth and email variables are required,
     and the build fails without them.
7. **Migrations run during Vercel builds** (`scripts/migrate-on-deploy.mjs`, using the direct
   connection), so the schema is in place before new code serves traffic.

## Consequences

- Auth.js v5 is still labelled beta. Pin the exact version and review its changelog before
  upgrading.
- One workspace per user in v1. Teams will need a workspace switcher and invitations, but no
  schema change (`Membership.role` exists).
- Preview deployments run migrations against whatever database the preview uses. Use Neon
  preview branches so previews never migrate production.
