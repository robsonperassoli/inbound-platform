# AGENTS.md

## Layout

- `apps/api` — Hono + Drizzle/SQLite (`@inbound/api`)
- `apps/dashboard` — Vite SPA (`@inbound/dashboard`)
- `apps/bio` — TanStack Start SSR (`@inbound/bio`)
- `apps/website` — Astro (`@inbound/website`)
- `packages/shared` — Zod schemas, themes, UUIDv7
- `packages/ui` — shared UI
- `packages/config` — shared TypeScript configs

## Commands

From the repo root:

- `pnpm install`
- `pnpm dev`
- `pnpm lint`
- `pnpm format` — CI checks with `pnpm format:check`
- `pnpm fallow:audit` — changed-file Fallow check (non-blocking in CI)
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm db:generate` — only way to add Drizzle migrations

## Rules

- Every PR adds or updates tests.
- Never commit secrets.
- New env vars: `.env.example` and `apps/api/.env.local.example`.
- Do not hand-edit a Drizzle migration after it has merged.
- Branch from Linear: `robsonperassoli/inb-XX-...`
- PR title includes the INB id.
- Keep formatting changes out of logic PRs.

## Dependencies

- The Node version is set in `mise.toml`. CI reads that file.
- Dependabot groups weekly npm and GitHub Actions updates. Patch updates auto-merge after `ci`. Minor and major stay for review.

## Tests

Colocate `*.test.ts` and `*.test.tsx` beside the source. Root `pnpm test` runs each package's `vitest run` through Turbo.

Component tests render with Testing Library in jsdom. Query by role, label, or text, and drive input with `userEvent`. Mock network and hooks with `vi.mock`. Assert behavior, not snapshots.

## Branch protection

- PR, 1 approval, dismiss stale reviews, resolve threads, up to date, check `ci`.
