# 0009. Plans and limits

- **Status:** Accepted
- **Date:** 2026-10-03

## Context

v1 has three plans and no payments:

| Plan    | Published products | Watermark |
| ------- | ------------------ | --------- |
| Free    | 1                  | Yes       |
| Starter | 10                 | No        |
| Pro     | 50                 | No        |

Prices are still undecided. Upgrades go through "contact us", and an admin sets the plan by
hand. Stripe should be addable later without rewrites.

## Decision

1. **Limits live in code,** in one file (`src/config/plans.ts`), keyed by the `Plan` enum.
   Prices sit there too (`null` = "contact us"). Changing a limit is a code change, reviewed and
   deployed like any other.
2. **The workspace stores only its plan** (`Workspace.plan`), plus who last set it and when.
   Everything else is derived from the config.
3. **Limits are enforced on the server at publish time:**
   - `assertCanPublish` runs inside the publish transaction and takes a per-workspace advisory
     lock, so concurrent publishes can't both slip past the limit.
   - Only live products count: published and not archived. Re-publishing a live product doesn't
     use another slot.
   - Drafts are unlimited.
4. **Downgrades never unpublish anything automatically.** A workspace over its limit keeps its
   live products but can't publish new ones until it's back under.
5. **Admins change plans** on `/admin`, which is limited to `ADMIN_EMAILS` and returns 404 for
   anyone else.
6. **Stripe later:**
   - Add a `Subscription` table (Stripe customer, subscription id, status, period end).
   - A webhook maps the Stripe price to a `Plan` and writes `Workspace.plan`.
   - Enforcement and the UI keep reading `Workspace.plan`, so they don't change.
   - Admin overrides can remain as a manual "comped" state.

## Consequences

- Per-workspace custom limits (e.g. 15 products for one customer) would need a nullable override
  column. That's not needed in v1.
- The watermark flag is defined here but takes effect in M5 (embed and image export).
