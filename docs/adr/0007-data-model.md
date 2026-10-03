# 0007. Data model and database access

- **Status:** Accepted
- **Date:** 2026-10-03

## Context

M3 adds accounts and persistence: Postgres on Neon with Prisma. The schema has to support
everything through M7 (products, versions, uploads, share links, quotes, events, modeling
requests), keep tenants apart, and leave room for teams and billing without building them.

## Decision

1. **Prisma 7 (stable) with the `pg` driver adapter.** The same driver works against Neon's
   pooled endpoint on Vercel, local Postgres and CI. The generated client goes to
   `apps/web/src/generated/prisma`; it is regenerated on install and not committed. Prisma 8
   was still a release candidate when this was decided.
2. **Two connection strings:** `DATABASE_URL` (pooled) for the app and `DATABASE_URL_UNPOOLED`
   (direct) for migrations.
3. **The workspace is the tenant.** Every merchant-owned row (products, assets, quotes, model
   requests) has a `workspaceId`. Authorization checks go through a single helper (`feature/auth`).
   `Membership` carries a role; only `OWNER` is used in v1, so teams need no schema change.
4. **Plans live on the workspace** as an enum (`FREE | STARTER | PRO`), with who changed it and
   when (admin overrides). Limits live in code config, not the database. Stripe can later add a
   subscription table that sets `plan`.
5. **Versions:**
   - Each `Product` has numbered `ProductVersion`s.
   - A draft is edited in place. Publishing freezes the version for good and points
     `Product.publishedVersionId` at it.
   - Share links and quotes reference a version, so they always show what the shopper saw.
   - The config is stored as JSON and validated with `@twirl/config-schema` before every write.
     `schemaVersion` is duplicated as a column to find rows that need migrating.
6. **Public ids are separate from primary keys:** `Product.publicId` and
   `SharedConfiguration.shortId` appear in URLs; cuid primary keys never do.
7. **Money is integer minor units,** as in the config. Quotes store the server-computed total.
8. **Deletes cascade from the workspace.** Users outlive workspaces. Assets in use by a
   version can't be deleted (`Restrict`).
9. **Local development** uses Postgres in Docker or Podman (`compose.yaml`). CI runs migrations,
   checks they match the schema, and runs database integration tests against a Postgres
   service.

## Consequences

- One draft per product is enforced in application code, not by a database constraint.
- Events are stored row-per-event, which is fine for v1 counts. High volume will need batching
  or rollups (M6).
- Deleting an asset requires first removing its versions or replacing their models.
