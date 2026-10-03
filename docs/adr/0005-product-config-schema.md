# 0005. Product config schema and engine

- **Status:** Accepted
- **Date:** 2026-10-03

## Context

Every product needs a description of what shoppers can change, what it costs and which
combinations are allowed. The same description drives the merchant editor (M4), the storefront
configurator, saved configurations and server-side price checks, so it must be versioned,
validated and identical everywhere.

## Decision

1. **One JSON document per product** (`ProductConfig`, `schemaVersion: 1`), validated with Zod in
   `@twirl/config-schema`: parts, option groups, pricing, rules, scene and presentation.
2. **Parts reference meshes by node name**, or `#path` for unnamed nodes. Names survive
   re-exports better than indices; meshes sharing a name are one part.
   - **Hidden meshes:** `hiddenMeshes` lists pieces of the file left out of the product entirely
     (never rendered). A hidden mesh can't also belong to a part. Added in schema v1 with a default
     of `[]`, so existing configs stay valid.
3. **Three option-group types:** colour (the model's original finish, optional swatches and an optional custom
   colour; a colour option may start with no swatches), visibility, and dimension. Swaps are out of scope for v1.
4. **Money is integer minor units** in one currency per product, formatted with `Intl`.
5. **Rules are data:** `requires`, `excludes` and `availability` (hide/disable), each with a
   shopper-facing message. The engine auto-corrects conflicts. It never undoes the shopper's
   latest change, and it reports each correction so the UI can explain it.
6. **Old configs migrate forward** through a registry keyed by schema version
   (`parseProductConfig`). Viewers declare the highest version they can render.
7. **The engine is zod-free** (`@twirl/config-schema/engine`). Storefronts receive an
   already-parsed config and run `evaluate` without the schema library, keeping it out of the
   page's initial JavaScript.
8. **The storefront UI is generated from the config** (`Configurator` in `@twirl/viewer/ui`).
   It supports three layouts (sidebar, bottom bar, fullscreen) and is themed from
   `presentation.theme`: the accent re-tints the brand palette, and the display font and logo
   are configurable.

## Consequences

- Renaming a mesh in the model breaks its part reference. The editor (M4) must flag parts whose
  meshes are missing.
- Prices shown in the browser are advisory. Orders must be re-priced on the server with the
  same engine.
- Uploads with no saved config get a generated starter config (a colour and a show/hide option
  per part).
