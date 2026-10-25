import { expect, test } from "@playwright/test"
import { API_URL } from "../src/servers"

test("signs in through the test login and reaches onboarding", async ({
  page,
}) => {
  await page.goto(`${API_URL}/auth/e2e-login?persona=fresh`)

  await expect(page.getByRole("heading", { name: /Welcome, E2E/ })).toBeVisible(
    { timeout: 30_000 },
  )
})
