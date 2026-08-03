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

### Backblaze B2 (uploads)

Used for avatar/background uploads via S3-compatible presigned URLs. Fill the `B2_*` vars from `.env.example` — create a **public** bucket, an application key scoped to it, and keep `B2_ENDPOINT` / `B2_REGION` / `B2_PUBLIC_URL` on the same region.

The dashboard uploads from the browser, so apply CORS on the bucket (CLI required — upload rules aren’t fully available in the web UI):

```bash
# brew install b2-tools
b2 account authorize

b2 bucket update --cors-rules '[
  {
    "corsRuleName": "dashboardUpload",
    "allowedOrigins": ["http://localhost:3000"],
    "allowedHeaders": ["*"],
    "allowedOperations": ["s3_put", "s3_get", "s3_head"],
    "exposeHeaders": ["ETag"],
    "maxAgeSeconds": 3600
  }
]' <bucket-name> allPublic
```

For staging/production, add the dashboard origin(s) to `allowedOrigins`.

For Stripe webhooks (ngrok required — localhost can’t be a Stripe endpoint):

```bash
pnpm dev:webhooks
```

Webhook URL: `https://factual-worm-mostly.ngrok-free.app/webhooks/stripe`

In the Stripe Dashboard → Developers → Webhooks endpoint, select these events (the API mirrors customers and subscriptions from them):

- `customer.created`
- `customer.updated`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

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
- **Internal cron:** `/internal/cron/*` — bearer `CRON_SECRET` (see Production notes)

## Production notes (later)

Railway layout (project `Inbound Platform`): **api** (Hono + SQLite volume at `/data`, 1 replica), **dashboard** (Vite SPA), **bio** (TanStack Start SSR), **cron** (curl → API every 5m). Object uploads stay on Backblaze B2 (`B2_*`); do not use a Railway bucket for media.

- Configure all values via environment variables (12-factor). Pin `RAILPACK_NODE_VERSION=24`.
- When using a local SQLite file/volume, run a **single API replica**. Set absolute `SQLITE_PATH=/data/inbound.sqlite` on the API service. Relative `SQLITE_PATH` / `MIGRATIONS_PATH` resolve against `process.cwd()` (`apps/api` under `pnpm --filter`).
- API: `pnpm --filter @inbound/api build` emits ESM to `apps/api/dist/` via tsup; production start is `pnpm --filter @inbound/api start:prod` (`node dist/migrate.js` then `node dist/index.js`). Local `dev` still uses `tsx`.
- Dashboard: `pnpm --filter @inbound/dashboard build` → static `apps/dashboard/dist`; production start is `serve -s dist` (SPA fallback).
- Bio production host: `https://s.uper.bio/<username>`
- Convex data migration and Railway cutover are intentionally deferred.
- **Abandoned form sessions auto-close**
  - **Local (`NODE_ENV=development`):** the API process runs an in-process interval (every 60s) that calls the same close logic — no manual curl needed.
  - **Production:** use HTTP cron (`POST /internal/cron/auto-close-threads`). The API does **not** schedule itself; until a scheduler calls it, idle sessions stay open.
  1. Set `CRON_SECRET` on the API service (required in every environment — local `.env` included; see `.env.example`).
  2. Add a separate Railway **Cron** service in the same project with schedule `*/5 * * * *` (UTC; Railway minimum is 5 minutes).
  3. Start command must curl the API and **exit** (overlapping runs are skipped if the process stays alive), e.g.  
     `curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" "$API_URL/internal/cron/auto-close-threads"`  
     Give that cron service the same `CRON_SECRET` and the public `API_URL`.
