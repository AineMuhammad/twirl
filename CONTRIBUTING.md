# Contributing to Twirl

## Branches

| Branch      | Purpose                                                 |
| ----------- | ------------------------------------------------------- |
| `main`      | Production. Only updated by release PRs from `develop`. |
| `develop`   | Integration branch and the default PR target.           |
| `feature/*` | New functionality, e.g. `feature/viewer-scene`          |
| `fix/*`     | Bug fixes                                               |
| `chore/*`   | Tooling, dependencies, configuration                    |
| `docs/*`    | Documentation only                                      |

Branch from `develop`, open a PR back into `develop`. Never force-push to `main` or `develop` and
never rewrite pushed history. Address review comments with new commits on the same branch.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/), enforced by commitlint on
`commit-msg`:

```
<type>(<optional scope>): <imperative summary>

feat(viewer): add per-part color selection
fix(web): keep embed iframe height in sync after rotation
docs(adr): record dimension behaviors
```

- **Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`,
  `revert`
- **Scopes** (optional): `web`, `viewer`, `config-schema`, `eslint-config`, `tsconfig`, `embed`,
  `api`, `db`, `auth`, `editor`, `admin`, `ci`, `deps`, `docs`, `adr`, `release`. Add new ones in
  `commitlint.config.mjs`.
- One concern per commit. No "wip" or "fix stuff" commits.
- Never commit secrets, `.env*` files (except `.env.example`), generated files or build output.

The `pre-commit` hook runs ESLint (`--fix`, zero warnings) and Prettier on staged files.

## Pull requests

Every PR description includes:

1. **Summary**: what and why
2. **What changed**: the notable changes and decisions
3. **Screenshots / GIF notes** for anything visual
4. **How to test**: a step-by-step manual checklist
5. **Known limitations**

CI (`ci` job: format, lint, typecheck, unit tests, build) must pass. Passing CI does not replace
manual testing.

## Releases

At the end of each milestone a release PR `develop → main` carries a changelog. After it merges,
the release is tagged (`v0.1.0`, …).

## Code standards

- TypeScript strict. No `any` without a comment explaining why.
- Validate with Zod at boundaries: API input, config JSON, env vars.
- Keep server and client code clearly separated. Server-only modules import `server-only`.
- Library packages (`viewer`, `config-schema`) must not import Next.js, the database or auth.
- Accessible UI: keyboard support, labels, visible focus states, sufficient contrast.
- User-facing errors are friendly. Log details server-side.
- Significant decisions get an [ADR](docs/adr/). Copy `docs/adr/template.md`.
