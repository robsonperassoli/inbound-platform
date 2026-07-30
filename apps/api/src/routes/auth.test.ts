import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../integrations/workos.ts", () => ({
  getAuthorizationUrl: vi.fn(),
  authenticateWithCode: vi.fn(),
  ensureUserFromWorkOS: vi.fn(),
  getWorkOsLogoutUrl: vi.fn(),
  getWorkOsSessionIdFromAccessToken: vi.fn(() => null),
  getWorkOS: vi.fn(() => null),
}))

import { getAuthorizationUrl } from "../integrations/workos"
import { client } from "../test/http"

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
})
