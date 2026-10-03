# 0011. Embedding on merchants' sites

- **Status:** Accepted
- **Date:** 2026-10-03

## Context

Merchants put configurators on any website, so the embed has to:

- Work everywhere, without conflicting with the host page's scripts and styles.
- Never expose the dashboard to clickjacking.
- Let the host page react to shopper choices.

## Decision

1. **An iframe of `/embed/[publicId]`,** created by a tiny dependency-free `public/embed.js` from
   `<div data-twirl-product="…">`. The iframe isolates our CSS, JS and WebGL from the host page.
   `publicId` is the product's unguessable public id; internal ids never appear in URLs.
2. **Only the live version is served.** Unpublished, archived or missing products show "This
   product isn't available". The public loader selects only what shoppers see (config, model key
   and the plan's watermark flag).
3. **Framing headers:**
   - `/embed/*` sends no framing restriction. `frame-ancestors *` would still block pages
     without a web origin, such as a local test file.
   - Every other route sends `X-Frame-Options: DENY` and `frame-ancestors 'none'`.
4. **postMessage protocol** (`src/lib/embed-protocol.ts`):
   - Messages: `ready`, `resize` (preferred height) and `change` (selections and price).
   - The embed posts with `*`, because it can't know the host's origin, and the data isn't
     sensitive.
   - `embed.js` accepts a message only if its origin is Twirl's (taken from the script's own
     URL), it comes from the frame the script created, and it has a valid shape. It re-emits
     messages as `twirl:ready` / `twirl:change` DOM events.
5. **Sizing:** the embed asks for a height from its width (landscape on desktop, portrait on
   phones, 480–900 px). A merchant can fix the height with `data-height`.
6. **Watermark:** Free-plan embeds show a small "Made with Twirl" link.
7. **Share links** (`/c/[shortId]`):
   - The Share button saves the shopper's choices against the published version they're
     looking at (`SharedConfiguration`).
   - The server validates the request (size limit, published version of a live product) and
     stores the rule-corrected choices.
   - Links keep showing that version after later publishes, and stop working if the product is
     archived.
   - `POST /api/share` accepts same-origin requests only. Rate limiting comes in M6.

## Consequences

- Prices in `twirl:change` are for display. Quotes and orders are re-priced on the server (M6).
- `embed.js` is served from our domain, so it changes for every site at once. Keep it backward
  compatible and keep the message format additive.
