# Twirl

Turn 3D models of your products into interactive configurators that shoppers can use on any
website.

Merchants upload a GLB/glTF model, choose which parts shoppers can customise (colours, optional
parts, sizes), set prices and rules, and publish. Shoppers change the product in 3D, see the price
update live, share their design, download an image and request a quote, all inside an embed that
works on any site.

**What the product does, in detail:** [docs/product.md](docs/product.md).
**How to deploy it:** [docs/deploy.md](docs/deploy.md).

## Features

- **3D configurator:** colours per part (presets plus an optional free colour picker), optional
  parts, size sliders that stretch or move parts, live price, compatibility rules, camera views,
  studio lighting, and three layouts with brand theming.
- **Product editor:** upload a model, pick and name parts, build options, set prices and rules,
  choose the look, preview as a shopper, and publish immutable versions with rollback.
- **Embed and sharing:** one-line embed for any website, share links pinned to the exact
  version, and high-resolution image downloads.
- **Leads:** quote requests priced on the server, emailed to the merchant, with an inbox in
  the dashboard.
- **Insight:** anonymous view, interaction, share, download and quote counts per product.
- **Plans:** Free, Starter and Pro limits enforced on the server, an upgrade-request flow, and an
  admin panel.
- **Services:** a "Need a 3D model?" request form for the modelling service.

## Tech stack

| Area       | Choice                                                               |
| ---------- | -------------------------------------------------------------------- |
| Monorepo   | pnpm workspaces + Turborepo                                          |
| App        | Next.js (App Router), TypeScript (strict), Tailwind CSS, on Vercel   |
| 3D         | three.js, React Three Fiber, drei                                    |
| Data       | Postgres on Neon, Prisma                                             |
| Auth       | Auth.js (Google and email magic links)                               |
| Storage    | Cloudflare R2 with presigned direct uploads                          |
| Email      | Resend                                                               |
| Rate limit | Upstash Redis                                                        |
| Validation | Zod at every boundary (API input, config JSON, env vars)             |
| Testing    | Vitest, Playwright (including axe accessibility checks)              |
| Quality    | ESLint, Prettier, Husky + lint-staged, commitlint, GitHub Actions CI |

## Getting started

### Prerequisites

- **Node.js 24** (see `.nvmrc`; with nvm, run `nvm use`)
- **pnpm 12**: the version is pinned in `package.json`. Run `corepack enable` once.
- **Docker or Podman** for the local Postgres database.

### Setup

```bash
git clone https://github.com/AineMuhammad/twirl.git
cd twirl
pnpm install                                # also installs git hooks and generates the Prisma client
cp .env.example apps/web/.env.local         # then fill in what you need (see below)
docker compose up -d                        # local Postgres on port 5433
pnpm --filter @twirl/web db:deploy          # apply migrations
pnpm dev                                    # http://localhost:3000
```

The demo (`/demo`) works with no configuration at all. Each other feature switches on when its
variables are set:

| Feature                    | Variables                                                                                 |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| Database (everything else) | `DATABASE_URL`, `DATABASE_URL_UNPOOLED`                                                   |
| Sign-in                    | `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`                                     |
| Email (links, quotes)      | `RESEND_API_KEY`, `EMAIL_FROM`                                                            |
| Uploads                    | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` |
| Rate limiting              | `KV_REST_API_URL`, `KV_REST_API_TOKEN`                                                    |
| Admin access               | `ADMIN_EMAILS`                                                                            |
| Sharper HDRIs, links       | `NEXT_PUBLIC_ASSETS_BASE_URL`, `NEXT_PUBLIC_APP_URL`                                      |

Every variable is documented in [`.env.example`](.env.example) and validated at startup. On
Vercel, the build fails if a required one is missing.

### Scripts

Run from the repository root. Turborepo runs each task in every package that defines it.

| Script              | What it does                        |
| ------------------- | ----------------------------------- |
| `pnpm dev`          | Start the Next.js dev server        |
| `pnpm build`        | Production build                    |
| `pnpm lint`         | ESLint in every package             |
| `pnpm typecheck`    | `tsc --noEmit` in every package     |
| `pnpm test`         | Unit and integration tests (Vitest) |
| `pnpm format`       | Format everything with Prettier     |
| `pnpm format:check` | Check formatting (what CI runs)     |

End-to-end tests: `pnpm --filter @twirl/web e2e` (Playwright; builds and starts the app).

### Database

The Prisma schema and migrations live in `apps/web/prisma/`. After changing the schema:

```bash
pnpm --filter @twirl/web db:migrate --name describe-the-change
```

Database integration tests (`*.integration.test.ts`) run when `DATABASE_URL` is set and are
skipped otherwise. CI runs them against a Postgres service. Vercel builds apply pending
migrations automatically.

## Repository layout

```
apps/
  web/                    Next.js app: dashboard, editor, embed, share links, APIs, embed.js
packages/
  config-schema/          Product config schema (Zod), migrations, rules and pricing engine
  viewer/                 3D viewer and configurator UI (React + R3F; no Next.js)
  eslint-config/, tsconfig/
docs/
  product.md              What the product does
  deploy.md               Production deployment guide
  architecture.md         System, data model and flows (Mermaid)
  adr/                    Architecture decision records
```

## Health check

`GET /api/health` returns `200 {"ok":true,"database":"ok"}` when the app and database respond, and
`503` otherwise. Point an uptime monitor at it.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the branch workflow, commit conventions and checks.

## License

Proprietary. See [LICENSE](LICENSE).
