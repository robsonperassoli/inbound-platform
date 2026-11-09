import { test } from "@playwright/test"

test.skip("Set WORKOS_API_KEY, WORKOS_CLIENT_ID, E2E_USER_EMAIL, and E2E_USER_PASSWORD in .env or apps/api/.env.local", () => {
  // This file is the only match when those values are absent, so the run skips instead of failing.
})
