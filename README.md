# Twirl

Turn existing 3D product models into interactive, embeddable product configurators.

Merchants upload a GLB/glTF model that's already split into meshes, map those meshes to named
parts, and define options: per-part colors, optional parts, part swaps, dimensions, scene
settings, pricing and compatibility rules. Shoppers configure the product in an embed that works
on any website, see a live price, and can share their configuration, download an image or request
a quote.

> **Status:** early development. Milestone 1 (viewer core) is done: try it at `/demo`. Product
> configuration, accounts and the editor come next.

## Tech stack

| Area       | Choice                                                               |
| ---------- | -------------------------------------------------------------------- |
| Monorepo   | pnpm workspaces + Turborepo                                          |
| App        | Next.js (App Router), TypeScript (strict), Tailwind CSS, Vercel      |
| 3D         | three.js, React Three Fiber, drei                                    |
| Data       | Postgres on Neon + Prisma _(M3)_                                     |
| Auth       | Auth.js: Google + email magic link _(M3)_                            |
| Storage    | Cloudflare R2 with presigned direct uploads _(M4)_                   |
| Email      | Resend _(M3/M6)_                                                     |
| Validation | Zod at every boundary (API input, config JSON, env vars)             |
| Testing    | Vitest, Playwright                                                   |
| Quality    | ESLint, Prettier, Husky + lint-staged, commitlint, GitHub Actions CI |

## Getting started

### Prerequisites

- **Node.js 24** (see `.nvmrc`; with nvm run `nvm use`)
- **pnpm 12**: the exact version is pinned in `package.json`. Run `corepack enable` once and pnpm
  picks it up automatically.
- **Docker or Podman**, for the local Postgres database (`compose.yaml`). Only needed for features
  that use the database; the demo works without it.

### Setup

```bash
git clone https://github.com/AineMuhammad/twirl.git
cd twirl
pnpm install                                # also installs the git hooks
cp .env.example apps/web/.env.local         # then uncomment the local DATABASE_URL lines
docker compose up -d                        # local Postgres on port 5433
pnpm --filter @twirl/web db:deploy          # apply migrations
pnpm dev                                    # http://localhost:3000
```

### Database

Prisma schema and migrations live in `apps/web/prisma/`. After changing the schema, create a
migration against your local database:

```bash
pnpm --filter @twirl/web db:migrate --name describe-the-change
```

`pnpm install` regenerates the Prisma client (into `apps/web/src/generated/`, not committed).
Database integration tests (`*.integration.test.ts`) run when `DATABASE_URL` is set and are
skipped otherwise. CI runs them against a Postgres service.

### Scripts

Run from the repository root. Turborepo runs each task in every package that defines it and
caches the results.

| Script              | What it does                    |
| ------------------- | ------------------------------- |
| `pnpm dev`          | Start the Next.js dev server    |
| `pnpm build`        | Production build                |
| `pnpm lint`         | ESLint in every package         |
| `pnpm typecheck`    | `tsc --noEmit` in every package |
| `pnpm test`         | Unit tests (Vitest)             |
| `pnpm format`       | Format everything with Prettier |
| `pnpm format:check` | Check formatting (what CI runs) |

Run a script in one package with `pnpm --filter <name> <script>`, e.g.
`pnpm --filter @twirl/config-schema test`.

## Repository layout

```
apps/
  web/                 Next.js app: dashboard, API routes, /embed and /c (share) routes, embed.js
packages/
  config-schema/       Zod schemas, rules engine and pricing engine. Pure TS, no React.
  viewer/              React + R3F configurator engine and UI layouts. No Next.js, DB or auth.
  eslint-config/       Shared ESLint flat configs (base, react-library, next)
  tsconfig/            Shared tsconfig presets
docs/
  adr/                 Architecture Decision Records
  architecture.md      System overview with diagrams
```

Two rules keep the architecture portable:

- **`config-schema` is pure** and runs in both the browser (live price) and the server
  (validating saved configs and quotes). The server never trusts a client-computed price.
- **`viewer` knows nothing about Next.js, the database or auth.** It takes a validated config,
  a model URL and selections, renders them, and reports events through callbacks, so it can later
  power a web component or the Shopify app. ESLint enforces the import ban.

See [`docs/architecture.md`](docs/architecture.md) and the [ADRs](docs/adr/) for details.

## Configuration

`APP_NAME` lives in [`apps/web/src/config/app.ts`](apps/web/src/config/app.ts); rename the product
there. Environment variables are documented in [`.env.example`](.env.example) and validated with
Zod at build time and at startup.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the branching model, commit conventions and PR
checklist.

## License

Proprietary. All rights reserved. See [LICENSE](LICENSE). The source is public for
transparency, but no rights to use, copy, modify or distribute it are granted.
