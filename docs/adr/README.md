# Architecture Decision Records

Each significant decision (architecture, data model, cost, or anything hard to reverse) gets a
short record here. Records are numbered and never rewritten. To change a decision, write a new ADR
that supersedes the old one and update the old one's status.

To add one, copy [`template.md`](template.md) to `NNNN-short-title.md` with the next number.

| ADR                                            | Title                                      | Status                       |
| ---------------------------------------------- | ------------------------------------------ | ---------------------------- |
| [0001](0001-monorepo.md)                       | Use a pnpm + Turborepo monorepo            | Accepted                     |
| [0002](0002-environments-and-asset-hosting.md) | HDRI environments and static asset hosting | Partially superseded by 0003 |
| [0003](0003-hdris-light-only.md)               | HDRIs light the scene only                 | Accepted                     |
| [0004](0004-look-and-rendering.md)             | Look and rendering pipeline                | Accepted                     |
| [0005](0005-product-config-schema.md)          | Product config schema and engine           | Accepted                     |
| [0006](0006-dimension-behaviours.md)           | Dimension behaviours                       | Accepted                     |
| [0007](0007-data-model.md)                     | Data model and database access             | Accepted                     |
| [0008](0008-authentication.md)                 | Authentication and authorization           | Accepted                     |
