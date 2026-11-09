Run locally with `pnpm e2e`. Playwright boots the API, dashboard, and bio on localhost and signs in through WorkOS.

Set `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`, `E2E_USER_EMAIL`, and `E2E_USER_PASSWORD` in `.env` or `apps/api/.env.local` (staging WorkOS). If any name is missing, the run skips.
