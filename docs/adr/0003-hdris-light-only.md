# 0003. HDRIs light the scene only

- **Status:** Accepted
- **Date:** 2026-10-02
- **Supersedes:** parts of [0002](0002-environments-and-asset-hosting.md) (environment backgrounds,
  ground projection, and when 2k is used)

## Context

ADR-0002 let an HDRI be shown as the background (optionally blurred) or ground-projected under the
product. On review, the product decision is that environments exist to show **how the lighting
would look** on the product. A photographic room or street behind it competes with the product,
clashes with merchants' own page design, and implies a setting the merchant didn't choose.

## Decision

1. HDRIs only provide image-based lighting, reflections, and the shadow-casting key light. The
   panorama is **never drawn**. Backgrounds are always the merchant's solid colour or gradient.
2. The `environment` background type and ground projection are removed.
3. **2k is chosen by viewer size alone:** viewers at least 1600 physical px wide load 2k when a 2k
   source is configured. Diffuse lighting looks the same at 1k and 2k, but three.js sizes its
   sharpest reflection level from the panorama, so mirror-like surfaces (chrome, glass, glossy
   paint) reflect twice as sharply on large screens. Phones and small embeds stay at 1k.
4. 2k files are served from the R2 public bucket under `hdri/2k/`. The CORS rule allows `GET`/`HEAD`
   from any origin; that's safe for public, read-only, egress-free assets.

Everything else in ADR-0002 still holds: the curated CC0 set, 1k in git, R2 for all assets, no Git
LFS, host-provided URLs, and automatic key-light detection with a 35° minimum elevation.

## Consequences

- On large screens an environment loads twice: 1k first, then 2k about 0.7 s later. Parsing a 2k
  file takes 160–180 ms on the main thread, versus 40–75 ms for 1k, plus pre-filtering, so there's
  a second short freeze. Decoding HDRs in a Web Worker would remove most of both; it's proposed for
  the M1 polish.
- The detected key-light direction is identical at 1k and 2k, so the light doesn't jump when 2k
  replaces 1k.
- The r2.dev URL is rate-limited by Cloudflare and sends no `Cache-Control`. Production should use
  a custom domain with a long-lived cache rule.
