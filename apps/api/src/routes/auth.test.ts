import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../integrations/workos.ts", () => ({
  getAuthorizationUrl: vi.fn(),
  authenticateWithCode: vi.fn(),
  ensureUserFromWorkOS: vi.fn(),
  getWorkOsLogoutUrl: vi.fn(),
  getWorkOS: vi.fn(() => null),
}))

import { app } from "../app"
import {
  authenticateWithCode,
  ensureUserFromWorkOS,
  getAuthorizationUrl,
} from "../integrations/workos"
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

  it("sets the session cookie from the WorkOS callback and redirects to the dashboard", async () => {
    vi.mocked(authenticateWithCode).mockResolvedValue({
      accessToken: accessToken({ sid: "session_123" }),
      refreshToken: "refresh",
      user: {
        object: "user",
        id: "user_workos",
        email: "ada@example.com",
        emailVerified: true,
        profilePictureUrl: null,
        firstName: "Ada",
        lastName: "Lovelace",
        lastSignInAt: null,
        locale: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        externalId: null,
        metadata: {},
      },
    })
    vi.mocked(ensureUserFromWorkOS).mockResolvedValue({
      id: "local-user",
      authId: "user_workos",
      email: "ada@example.com",
      name: "Ada Lovelace",
      profilePictureUrl: null,
      createdAt: 0,
    })

    const res = await app.request("/auth/callback?code=abc", {
      redirect: "manual",
    })

    expect(res.status).toBe(302)
    expect(res.headers.get("location")).toBe("http://localhost:3000")
    const cookies = res.headers.getSetCookie().join("\n")
    expect(cookies).toContain("inbound_session=local-user")
    expect(cookies).toContain("workos_sid=session_123")
    expect(cookies).toContain("HttpOnly")
    expect(cookies.toLowerCase()).not.toContain("secure")
  })
})

function accessToken(payload: unknown) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url")
  return `eyJhbGciOiJub25lIn0.${body}.sig`
}
