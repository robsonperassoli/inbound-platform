import { describe, expect, it } from "vitest"
import {
  buildAuthSessionCookies,
  getWorkOsSessionIdFromAccessToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  WORKOS_SID_COOKIE,
} from "./session"

function accessToken(payload: unknown) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url")
  return `eyJhbGciOiJub25lIn0.${body}.sig`
}

describe("auth session cookies", () => {
  it("seals the callback session as the user id", () => {
    const [cookie] = buildAuthSessionCookies({
      userId: "user_123",
      nodeEnv: "development",
    })

    expect(cookie).toEqual({
      name: SESSION_COOKIE,
      value: "user_123",
      httpOnly: true,
      sameSite: "Lax",
      path: "/",
      secure: false,
      maxAge: SESSION_MAX_AGE_SECONDS,
    })
  })

  it("marks the cookie secure only when NODE_ENV is production", () => {
    const [production] = buildAuthSessionCookies({
      userId: "user_123",
      nodeEnv: "production",
    })
    const [test] = buildAuthSessionCookies({
      userId: "user_123",
      nodeEnv: "test",
    })

    expect(production?.secure).toBe(true)
    expect(test?.secure).toBe(false)
  })

  it("adds the WorkOS session id from the access token", () => {
    const cookies = buildAuthSessionCookies({
      userId: "user_123",
      accessToken: accessToken({ sid: "session_123" }),
      nodeEnv: "development",
    })

    expect(cookies.map((cookie) => cookie.name)).toEqual([
      SESSION_COOKIE,
      WORKOS_SID_COOKIE,
    ])
    expect(cookies[1]?.value).toBe("session_123")
    expect(getWorkOsSessionIdFromAccessToken("not-a-jwt")).toBeNull()
  })
})
