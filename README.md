# Inbound Platform

Monorepo for the inbound bio platform: Hono API, SPA dashboard, SSR bio renderer, and shared UI.

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
- **Auth:** `/auth/*` — WorkOS login/callback
- **Webhooks:** `/webhooks/stripe`
- **Dashboard:** authenticated routes at `/profiles`, `/forms`, `/threads`, `/billing`, etc. (no version prefix)

## Production notes (later)

- Configure all values via environment variables (12-factor).
- When using a local SQLite file/volume, run a **single API replica**.
- Bio production host: `https://s.uper.bio/<username>`
- Convex data migration and Railway cutover are intentionally deferred.
