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

## Branch protection

Apply with admin `gh`: `./scripts/apply-github-settings.sh`

- 1 approval; dismiss stale reviews; resolve threads; branch up to date.
- Check `ci` (`e2e` in Step 8). Source: `.github/rulesets/main.json`.
- Admin bypass only. Squash merge, delete head branch, auto-merge.
