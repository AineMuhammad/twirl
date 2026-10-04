# Sample models

Builds the demo models from open-licensed sources in the
[Khronos glTF Sample Assets](https://github.com/KhronosGroup/glTF-Sample-Assets) repository.
Credits and licences are in [`apps/web/public/samples/CREDITS.md`](../../apps/web/public/samples/CREDITS.md).

This folder is outside the pnpm workspace on purpose: its dependencies (sharp, meshoptimizer) are
only needed to rebuild models, never by the app.

The built files are hosted on R2, not committed ([ADR 0013](../../docs/adr/0013-demo-sample-models.md)).
Build them once to run the demo locally without `NEXT_PUBLIC_ASSETS_BASE_URL`:

```bash
cd tools/sample-models
npm install
npm run fetch    # downloads sources into raw/ (pinned commit)
npm run build    # writes apps/web/public/samples/<id>.glb (git-ignored) and the manifest
npm run upload   # uploads to R2 at samples/<version>/ (reads apps/web/.env.local)
```

`npm run build -- sneaker toy-car` rebuilds only those models. `npm run upload -- --dry-run`
lists what would be uploaded. The upload never overwrites a different file: after changing a model
that's already hosted, bump `version` in `apps/web/src/lib/sample-manifest.json` and
`HOSTED_SAMPLES_VERSION` in `apps/web/src/lib/demo-config.ts`.

## What the build does

For each model (`build.mjs` holds one recipe per product):

1. **Cleans up:** removes cameras, punctual lights, animations, material variants and props that
   aren't part of the product (e.g. the toy car's display cloth). Removes a trademark logo texture
   from the sunglasses.
2. **Segments into parts:** single-mesh models are split into connected pieces (welded by
   position, so UV seams don't break a piece). Each piece is assigned to a named part by its
   sampled texture colour or position. `npm run analyze -- raw/<Name>.glb <node>` prints the
   pieces of a mesh to help write a recipe.
3. **Flattens the hierarchy:** every part becomes a top-level node, so colouring one part never
   colours another through a parent.
4. **Names nodes** with stable, unique names that the sample configs reference
   (`packages/config-schema/src/samples/*.ts`).
5. **Scales to real-world size** in metres (dimension sliders and AR rely on it).
6. **Compresses:** Meshopt geometry and WebP textures (max 2048 px). The viewer decodes both.

`apps/web/src/lib/sample-manifest.json` (committed) records each file's size, hash and mesh node
names. `apps/web/src/lib/demo-config.test.ts` checks every node a sample config references against
it, so a rebuild that renames a part fails CI even though the files aren't in git.
