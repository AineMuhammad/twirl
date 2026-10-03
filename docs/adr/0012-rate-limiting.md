# 0012. Rate limiting public endpoints

- **Status:** Accepted
- **Date:** 2026-10-03

## Context

Quote requests (which email merchants), share links and event batches are public: anyone can
call them without signing in. Without limits, a script could flood merchants' inboxes, exhaust
the email quota, or fill the database.

## Decision

1. **Upstash Redis with `@upstash/ratelimit`,** through Vercel's integration (`KV_REST_API_URL`,
   `KV_REST_API_TOKEN`). Counters must be shared across all serverless instances; in-memory
   counters wouldn't be. REST suits short-lived functions better than TCP connections.
2. **Sliding windows per visitor:**

   | Endpoint      | Limit             |
   | ------------- | ----------------- |
   | Quotes        | 5 per 10 minutes  |
   | Share links   | 20 per 10 minutes |
   | Event batches | 60 per minute     |

   Over the limit returns 429 with `Retry-After` and a friendly message.

3. **No raw IPs are stored.** The visitor key is an HMAC of the IP with `AUTH_SECRET`.
4. **Fail open.** If Redis errors or takes longer than 1.5 s, the request is allowed and the
   failure is logged. A limiter outage shouldn't block shoppers.
5. **Off without configuration** (local development). Required on Vercel, so production can't
   run unprotected by accident.
6. **Layered with other checks:**
   - Public POSTs also require a same-origin `Origin`.
   - The quote form has a honeypot field.
   - Every input is validated and size-capped.

## Consequences

- Visitors behind one shared IP (offices, mobile carriers) share a limit. The limits are generous
  enough for real use.
- Each limited request costs about one Redis command; this fits Upstash's free tier at v1 scale.
