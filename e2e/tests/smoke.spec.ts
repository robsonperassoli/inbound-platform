import { expect, test } from "@playwright/test"

test("starts signed in and reaches onboarding", async ({ page }) => {
  await page.goto("/")

  await expect(page.getByRole("heading", { name: /Welcome, E2E/ })).toBeVisible(
    { timeout: 30_000 },
  )
})
