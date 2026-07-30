# Inbound Platform

Monorepo for the inbound.click platform: Hono API, SPA dashboard, SSR bio renderer, and shared UI.

## Apps

| App | Path | Port | Role |
|-----|------|------|------|
| API | `apps/api` | 8787 | Hono + Drizzle + SQLite |
| Dashboard | `apps/dashboard` | 3000 | Vite SPA |
| Bio | `apps/bio` | 3001 | TanStack Start SSR (`s.uper.bio/<username>`) |

## Packages

- `@inbound/shared` — Zod schemas, themes, UUIDv7 helper
- `@inbound/ui` — shared `UserPage` and bio primitives
- `@inbound/config` — shared TypeScript configs

## Stack

- Node + pnpm + Turborepo
- TypeScript 7
- Oxlint (type-aware) + Oxfmt
- SQLite with **WAL mode**, Drizzle ORM, **UUID v7** IDs
- WorkOS AuthKit, Stripe, Resend (send-only), Tinybird, Backblaze B2

## Setup

```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

### Tinybird (analytics)

Config lives in `apps/api` (`tinybird.config.json`). Local Tinybird runs in Docker via the Tinybird CLI (`tb`). Install it if needed, then:

```bash
pnpm tb:start
tb token copy "admin local_testing@tinybird.co"
```

Put the copied token in **both**:

1. Root `.env` — used by the API at runtime
2. `apps/api/.env.local` — used by the Tinybird CLI (next to `tinybird.config.json`)

```bash
TINYBIRD_URL=http://localhost:7181
TINYBIRD_TOKEN=<token from above>
```

Sync datasources and pipes (watch mode):

```bash
pnpm tinybird:dev
```

Then run the apps as usual with `pnpm dev`.

Production: set `TINYBIRD_URL` / `TINYBIRD_TOKEN` in the API environment to your Tinybird cloud host and workspace token. Deploy schemas with `pnpm tinybird:deploy`.

For Stripe webhooks (ngrok required — localhost can’t be a Stripe endpoint):

```bash
pnpm dev:webhooks
```

Webhook URL: `https://factual-worm-mostly.ngrok-free.app/webhooks/stripe`

Or tunnel alone while `pnpm dev` is already up:

```bash
pnpm stripe:tunnel
```

- API health: http://localhost:8787/health
- Public profile: http://localhost:8787/public/profiles/demo
- Bio page: http://localhost:3001/demo
- Dashboard: http://localhost:3000

## API surface

- **Public (bio):** `/public/*` — profiles, links, form sessions
- **Auth:** `/auth/*` — WorkOS login/callback/logout
- **Webhooks:** `/webhooks/stripe`, `/webhooks/workos` (provider callbacks)
- **Authenticated resources:** `/me`, `/profiles`, `/links`, `/forms`, `/threads`, `/uploads`, `/billing`, `/analytics`, `/support`, `/team`, `/invitations`, `/system`, etc. (no version prefix)

## Production notes (later)

- Configure all values via environment variables (12-factor).
- When using a local SQLite file/volume, run a **single API replica**.
- Bio production host: `https://s.uper.bio/<username>`
- Convex data migration and Railway cutover are intentionally deferred.
