import { createServer, type Server } from "node:http"
import { expect, test } from "@playwright/test"
import { BIO_URL } from "../src/servers"

const username = "e2euser"
const linkTitle = "E2E Site"
let linkUrl = ""
let linkTarget: Server | undefined

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
})

test.describe("profile", () => {
  test.describe.configure({ mode: "serial" })

  test.beforeAll(async () => {
    linkTarget = createServer((_req, res) => {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" })
      res.end(
        "<!doctype html><title>E2E link target</title><h1>E2E link target</h1>",
      )
    })
    await new Promise<void>((resolve) => {
      linkTarget?.listen(0, "127.0.0.1", () => resolve())
    })
    const address = linkTarget.address()
    if (!address || typeof address === "string") {
      throw new Error("Link target server did not bind")
    }
    linkUrl = `http://127.0.0.1:${address.port}/e2e-site`
  })

  test.afterAll(async () => {
    if (!linkTarget) return
    await new Promise<void>((resolve, reject) => {
      linkTarget?.close((error) => (error ? reject(error) : resolve()))
    })
  })

  test("signs in and completes onboarding", async ({ page }) => {
    await page.goto("/")

    await expect(
      page.getByRole("heading", { name: /Welcome, E2E/ }),
    ).toBeVisible({ timeout: 30_000 })

    await page.getByRole("button", { name: "Let's Get Started" }).click()
    await page.getByLabel("Page name").fill("E2E Creator")
    await page.getByRole("button", { name: "Continue" }).click()
    await page.getByLabel("Public URL").fill(username)
    // The username check is debounced. Clicking Continue while it is in
    // flight is discarded, so wait until the handle is confirmed available.
    await expect(
      page.getByText(/Available\. Your page will live at/),
    ).toBeVisible()
    await page.getByRole("button", { name: "Continue" }).click()
    await page.getByLabel("Short intro").fill("Hello from e2e")
    await page.getByRole("button", { name: "Create My Page" }).click()

    await expect(page.getByText("Your profile is ready.")).toBeVisible({
      timeout: 20_000,
    })
    await expect(page.getByRole("link", { name: "Book a call" })).toBeVisible()
  })

  test("creates a link and publishes the profile", async ({ page }) => {
    await page.goto("/")

    await expect(page.getByRole("link", { name: "Book a call" })).toBeVisible({
      timeout: 30_000,
    })
    await page.getByRole("button", { name: "Add Button" }).click()
    await page.getByRole("menuitem", { name: /Add a link/ }).click()

    const dialog = page.getByRole("dialog", { name: "Add Button" })
    await dialog.getByPlaceholder("Book a tour").fill(linkTitle)
    await dialog.getByPlaceholder("https://example.com").fill(linkUrl)
    await dialog.getByRole("button", { name: "Create" }).click()

    await expect(page.getByRole("link", { name: linkTitle })).toBeVisible()
    await page.getByRole("button", { name: "Publish" }).click()
    await expect(
      page.getByText("Your profile is now live.").first(),
    ).toBeVisible()
    await expect(page.getByText("Your profile is ready.")).toHaveCount(0)
  })

  test("shows the published link on the public bio page", async ({ page }) => {
    await page.goto(`${BIO_URL}/${username}`)
    await expect(
      page.getByRole("heading", { name: "E2E Creator" }),
    ).toBeVisible({ timeout: 30_000 })

    const link = page.getByRole("link", { name: linkTitle })
    await expect(link).toBeVisible()
    const popupPromise = page.waitForEvent("popup")
    await link.click()
    const popup = await popupPromise
    await expect(
      popup.getByRole("heading", { name: "E2E link target" }),
    ).toBeVisible()
  })
})

test("submits the bio form and shows it in the dashboard", async ({ page }) => {
  await page.goto(`${BIO_URL}/demo`)
  await expect(page.getByRole("heading", { name: "Demo Creator" })).toBeVisible(
    { timeout: 30_000 },
  )

  const answer = page.getByPlaceholder("Answer here...")
  await expect(async () => {
    await page.getByRole("button", { name: "Contact" }).click()
    await expect(answer).toBeVisible({ timeout: 1_000 })
  }).toPass({ timeout: 20_000 })
  await answer.fill("My name is Ada Lovelace and my email is ada@example.com")
  await answer.press("Enter")
  await expect(page.getByText("Thanks, you're all set.")).toBeVisible({
    timeout: 20_000,
  })

  await page.goto("/forms")
  await page.getByRole("link", { name: "Submissions" }).click()
  await expect(page.getByText("Ada Lovelace")).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText("ada@example.com")).toBeVisible()
})
