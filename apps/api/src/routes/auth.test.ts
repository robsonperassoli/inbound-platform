import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../integrations/workos.ts", () => ({
  getAuthorizationUrl: vi.fn(),
  authenticateWithCode: vi.fn(),
  ensureUserFromWorkOS: vi.fn(),
  getWorkOsLogoutUrl: vi.fn(),
  getWorkOsSessionIdFromAccessToken: vi.fn(() => null),
  getWorkOS: vi.fn(() => null),
}))

import { app } from "../app"
import { getAuthorizationUrl } from "../integrations/workos"
import { createUserAccount } from "../test/factories"
import { client, withAuth } from "../test/http"

describe("auth routes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("clears session on POST /auth/logout", async () => {
    const res = await client.auth.logout.$post()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })

  it("redirects to signin when WorkOS is unconfigured", async () => {
    vi.mocked(getAuthorizationUrl).mockImplementation(() => {
      throw new Error("WorkOS is not configured")
    })

    const res = await client.auth.login.$get(undefined, {
      init: { redirect: "manual" },
    })
    expect(res.status).toBeGreaterThanOrEqual(300)
    expect(res.status).toBeLessThan(400)
    const location = res.headers.get("Location")
    expect(location).toContain("/signin?workos=unconfigured")
  })

  it("redirects to WorkOS when configured", async () => {
    vi.mocked(getAuthorizationUrl).mockReturnValue(
      "https://api.workos.com/sso/authorize?client_id=test",
    )

    const res = await client.auth.login.$get(undefined, {
      init: { redirect: "manual" },
    })
    expect(res.status).toBeGreaterThanOrEqual(300)
    expect(res.status).toBeLessThan(400)
    expect(res.headers.get("Location")).toBe(
      "https://api.workos.com/sso/authorize?client_id=test",
    )
  })

  it("is off when NODE_ENV is production, even if the bypass flag is set", async () => {
    const previousNodeEnv = process.env.NODE_ENV
    const previousBypass = process.env.E2E_AUTH_BYPASS
    process.env.NODE_ENV = "production"
    process.env.E2E_AUTH_BYPASS = "1"

    try {
      const res = await app.request("/auth/e2e-login")
      expect(res.status).toBe(404)
      expect(await res.json()).toEqual({ error: "Not found" })
      expect(res.headers.get("set-cookie")).toBeNull()
    } finally {
      process.env.NODE_ENV = previousNodeEnv
      if (previousBypass === undefined) delete process.env.E2E_AUTH_BYPASS
      else process.env.E2E_AUTH_BYPASS = previousBypass
    }
  })

  it("stays off when the bypass flag is unset", async () => {
    const previousBypass = process.env.E2E_AUTH_BYPASS
    delete process.env.E2E_AUTH_BYPASS

    try {
      const res = await app.request("/auth/e2e-login?persona=fresh")
      expect(res.status).toBe(404)
    } finally {
      if (previousBypass === undefined) delete process.env.E2E_AUTH_BYPASS
      else process.env.E2E_AUTH_BYPASS = previousBypass
    }
  })

  it("signs in a harness user and marks the account subscribed without Stripe", async () => {
    const previousBypass = process.env.E2E_AUTH_BYPASS
    process.env.E2E_AUTH_BYPASS = "1"

    try {
      const first = await app.request("/auth/e2e-login")
      const second = await app.request("/auth/e2e-login")
      expect(first.status).toBe(302)
      expect(first.headers.get("location")).toBe("http://localhost:3000")

      const firstUserId = sessionUserId(first)
      const secondUserId = sessionUserId(second)
      expect(firstUserId).toBeTruthy()
      expect(secondUserId).toBe(firstUserId)

      const me = await client.me.$get(undefined, withAuth(firstUserId!))
      expect(me.status).toBe(200)
      const body = await me.json()
      expect(body.user.email).toBe("e2e@inbound.click")
      expect(body.subscribed).toBe(true)

      const fresh = await app.request("/auth/e2e-login?persona=fresh")
      expect(sessionUserId(fresh)).not.toBe(firstUserId)
    } finally {
      if (previousBypass === undefined) delete process.env.E2E_AUTH_BYPASS
      else process.env.E2E_AUTH_BYPASS = previousBypass
    }
  })

  it("signs in the seeded demo user and rejects a missing seed", async () => {
    const previousBypass = process.env.E2E_AUTH_BYPASS
    process.env.E2E_AUTH_BYPASS = "1"

    try {
      const missing = await app.request("/auth/e2e-login?persona=seed")
      expect(missing.status).toBe(500)

      const { user } = await createUserAccount({
        email: "dev@inbound.click",
        name: "Dev User",
      })
      const res = await app.request("/auth/e2e-login?persona=seed")
      expect(res.status).toBe(302)
      expect(sessionUserId(res)).toBe(user.id)
    } finally {
      if (previousBypass === undefined) delete process.env.E2E_AUTH_BYPASS
      else process.env.E2E_AUTH_BYPASS = previousBypass
    }
  })
})

function sessionUserId(res: Response) {
  const cookie = res.headers.get("set-cookie") ?? ""
  return cookie.match(/inbound_session=([^;]+)/)?.[1]
}
