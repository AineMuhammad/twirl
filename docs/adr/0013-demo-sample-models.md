# 0013. Host demo sample models on R2 and build them reproducibly

- **Status:** Accepted
- **Date:** 2026-10-04

## Context

The demo should show Twirl working for every market we sell to (furniture, lighting, fashion,
home and kitchen, electronics, toys, commercial equipment), not only the lounge chair and jeep.
Fifteen suitable open-licensed models exist in the Khronos glTF Sample Assets repository, but they
need work before they configure well: several are a single mesh, some nest parts under other
parts (colouring a parent colours its children), units vary from centimetres to tens of metres,
and two carry trademark logos. Compressed, they total about 19.5 MB.

[ADR 0002](0002-environments-and-asset-hosting.md) keeps large binaries out of git (every clone and
Vercel build pays for them, and Git LFS bandwidth runs out) and puts hosted assets on R2 behind
`NEXT_PUBLIC_ASSETS_BASE_URL`.

## Decision

1. **A reproducible pipeline** in `tools/sample-models/` fetches the sources (pinned commit),
   segments, names, flattens, rescales and compresses each model (one recipe per product), and
   writes `apps/web/public/samples/<id>.glb`. It is outside the pnpm workspace so its dependencies
   never reach the app.
2. **The new models live on R2** at `samples/<version>/<file>`, uploaded by `npm run upload` with
   the app's R2 credentials, with `Cache-Control: immutable`. A changed model goes in a new version
   folder; the upload refuses to overwrite.
3. **The app loads them from `NEXT_PUBLIC_ASSETS_BASE_URL`**, falling back to `/samples/` for
   local development, where the pipeline's output is git-ignored. `sofa.glb` and `jeep_2021.glb`
   stay in git (the landing page uses the sofa).
4. **A committed manifest** (`apps/web/src/lib/sample-manifest.json`: version, size, SHA-256 and
   mesh node names per file) lets CI check that every node a sample config references exists,
   without the files. Locally built files are also checked against their hashes.
5. **Credits** for CC BY models, with the changes made, are in
   `apps/web/public/samples/CREDITS.md`.

## Alternatives considered

- **Commit the models to git**: simplest, but adds ~20 MB to history permanently, against ADR 0002.
- **Load them from the Khronos repository at runtime**: a third-party dependency for the embed, and
  the sources aren't segmented or compressed.
- **Upload them as a merchant would (through the editor)**: needs a database and an account in
  every environment, and the demo would depend on that data existing.

## Consequences

- Deployments without `NEXT_PUBLIC_ASSETS_BASE_URL` (or without the files uploaded) show the new
  samples failing to load; the lounge chair and jeep still work. Preview and production need the
  variable, and the files must be uploaded once per version.
- The R2 bucket's CORS rule must allow the app's origins (already required for 2k HDRIs).
- Rebuilding a model that was already uploaded means bumping `version` in the manifest and
  `HOSTED_SAMPLES_VERSION` in `demo-config.ts` (a test keeps them equal).
- If a rebuild renames a part, the manifest changes and CI fails until the sample config is fixed.
