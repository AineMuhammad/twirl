# 0001. Use a pnpm + Turborepo monorepo

- **Status:** Accepted
- **Date:** 2026-10-02

## Context

Twirl has one deployable app today (the Next.js dashboard, API and embed routes) but several pieces
of code with different audiences:

- The **product config schema, rules engine and pricing engine** must run identically in the
  browser (live price) and on the server (validating saved configs and quotes; the server never
  trusts a client-computed price).
- The **3D viewer** must be embeddable anywhere: inside our app, in an iframe embed, later as a web
  component and inside a Shopify app (v2). It must not depend on Next.js, the database or auth.
- Lint, TypeScript and formatting rules should be identical everywhere.

We are a very small team, so tooling overhead must stay low and changes that span packages should
land in a single PR.

## Decision

Use a single repository with **pnpm workspaces** and **Turborepo**:

```
apps/web                 Next.js app (deployed to Vercel)
packages/config-schema   pure TS: schemas, rules, pricing (no React)
packages/viewer          React + R3F engine and UI (no Next.js / DB / auth)
packages/eslint-config   shared flat ESLint configs
packages/tsconfig        shared tsconfig presets
```

- **Internal packages export TypeScript source** (`"exports": { ".": "./src/index.ts" }`) and have
  no build step. The app compiles them with Next.js `transpilePackages`, and Vitest runs them
  directly. Packages get a build step only when something outside the monorepo needs to consume
  them (e.g. the Shopify app or a published web component).
- **Boundaries are enforced by lint**, not convention. The `react-library` ESLint preset bans
  imports of `next`, Prisma and auth packages, and imports of the app itself.
- **Turborepo** runs `lint`, `typecheck`, `test` and `build` across packages with caching.
  Because packages have no build output, `typecheck`, `test` and `build` depend on a no-op
  `transit` task. Tasks still run in parallel, but their cache keys include the package's
  internal dependencies, so editing `config-schema` invalidates `web`'s cached build.
- **pnpm** is pinned via `packageManager` (Corepack). Install scripts need explicit approval
  (`allowBuilds`), and pnpm's minimum-release-age supply-chain check stays on.
- Versions are pinned exactly. The current exceptions to "latest stable" are TypeScript 6.0
  (`typescript-eslint` supports `<6.1`) and ESLint 9 (`eslint-config-next`'s plugins don't support
  ESLint 10). Revisit both when upstream catches up.

## Alternatives considered

- **Single Next.js app with folders instead of packages.** Simpler at first, but nothing would stop
  the viewer from importing Next.js or server code, and extracting it later for the Shopify app or a
  web component would be a rewrite.
- **Multiple repositories.** Cross-cutting changes (schema plus viewer plus app) would need
  coordinated releases and versioning, which is far too much overhead for this team size.
- **npm/Yarn workspaces, or Nx.** pnpm's strict `node_modules` catches undeclared dependencies, and
  its store is fast and disk-efficient. Turborepo is the lighter-weight orchestrator and is
  first-class on Vercel. Nx is more powerful but brings more configuration than we need.
- **Building packages to `dist/`.** Adds watch processes and source-map indirection for no benefit
  while every consumer lives in the monorepo.

## Consequences

- One PR can change the schema, the viewer and the app together, and CI checks them together.
- Packages are not independently publishable as-is. Publishing one later means adding a build
  step (e.g. tsup) for that package only.
- Every new internal package must be added to `transpilePackages` in `apps/web/next.config.ts`.
- Strict pnpm resolution occasionally surfaces upstream packages with undeclared dependencies.
  For example, `eslint-config-next` needs `next` installed alongside it, so `@twirl/eslint-config`
  declares `next` as a dev and optional peer dependency.
- Vercel builds the monorepo with the project root set to `apps/web`; Turborepo is detected
  automatically.
