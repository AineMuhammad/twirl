# 0002. HDRI environments and static asset hosting

- **Status:** Accepted; partially superseded by [0003](0003-hdris-light-only.md) (backgrounds, ground projection, 2k rule)
- **Date:** 2026-10-02

## Context

The viewer started with procedural lighting only (presets built from in-scene light panels). They
are instant and need no download, but they can't show a product in a recognisable setting (a
living room, a street, a showroom). We want photographic environments without hurting load time on
phones or making the embed depend on third-party servers.

Constraints:

- The embed must not depend on third-party CDNs (reliability, privacy, CSP friendliness).
- Mobile data and memory are limited. A 1k HDRI is ~1.5 MB; a 2k one is ~6 MB.
- Git history should stay small: the repo is public and cloned in CI and by Vercel on every build.
- Merchant uploads (M4) need object storage anyway.

## Decision

1. **Eight curated Poly Haven HDRIs (CC0)**: studio, loft, living room, warehouse, garage, city
   street, open sky, sunset. They're available as `scene.lighting` values next to the procedural
   presets, which stay the default (zero download).
2. **1k files live in git** (`apps/web/public/hdri/1k/`, ~12 MB total) and are served by our own
   app. 1k is used for lighting and reflections everywhere.
3. **2k files live on Cloudflare R2** (`hdri/2k/` in the `twirl` bucket) and are only requested
   when the environment is the **visible background** on a viewer at least **1600 physical pixels**
   wide. 1k stays on screen until 2k arrives.
4. **Cloudflare R2 is the store for all hosted assets**, including the M4 merchant uploads. We
   briefly considered AWS S3 and chose R2 for no egress fees and S3 API compatibility.
5. **No Git LFS.** Vercel fetches LFS objects on every build, and GitHub's free LFS bandwidth would
   run out after a few dozen deploys.
6. **The viewer gets base URLs from the host** (`environmentSources`) and never hard-codes a host,
   so the Shopify app or a web component can serve the files elsewhere.
7. **Shadows follow the photo.** The key light comes from the compass direction of the
   panorama's brightest region (coarse luminance grid, above the horizon), raised to at least 35°
   so shadows stay under the product. Its strength scales with how dominant that light is: crisp
   shadows under a clear sun, faint ones when overcast.
8. **Optional ground projection** (three's `GroundedSkybox`) makes the product stand in the
   photographed space. It assumes model units are metres (glTF's convention).

## Alternatives considered

- **drei's built-in presets.** They download HDRIs from a third-party CDN at runtime, which breaks
  the no-third-party rule.
- **2k for everything.** 4× the download for lighting that looks the same; phones would pay ~6 MB
  per environment.
- **Commit 2k to git.** Adds ~46 MB to history permanently, on every clone and every Vercel build.
- **Hand-placed key lights per HDRI.** More art direction, but it doesn't scale to merchant-supplied
  environments later. Automatic detection plus a minimum elevation gives consistent results.

## Consequences

- R2 needs **public read access** (custom domain or r2.dev) and a **CORS rule** allowing our app's
  origins, otherwise 2k requests fail. When they fail, the viewer keeps the 1k version; when 1k
  fails, it keeps procedural lighting.
- Switching to an HDRI costs main-thread time: about 370 ms the first time (one-off shader
  compilation) and 70–110 ms per later switch on a desktop (parsing plus pre-filtering). Phones will
  be several times slower. Possible follow-ups are decoding in a Web Worker and asynchronous shader
  compilation (`renderer.compileAsync`).
- Environment intensities are hand-tuned starting values. Replacing a file means adding it under a
  new name, because these files are cached for a long time.
