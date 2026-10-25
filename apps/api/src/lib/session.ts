export const SESSION_COOKIE = "inbound_session"
export const WORKOS_SID_COOKIE = "workos_sid"
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

export type SessionCookie = {
  name: string
  value: string
  httpOnly: true
  sameSite: "Lax"
  path: "/"
  secure: boolean
  maxAge: number
}

/** Extract WorkOS session id (`sid`) from an access token JWT payload. */
export function getWorkOsSessionIdFromAccessToken(
  accessToken: string | null | undefined,
): string | null {
  if (!accessToken) return null
  const parts = accessToken.split(".")
  if (parts.length < 2 || !parts[1]) return null

  try {
    const json = Buffer.from(parts[1], "base64url").toString("utf8")
    const payload: unknown = JSON.parse(json)
    if (!payload || typeof payload !== "object" || !("sid" in payload)) {
      return null
    }
    return typeof payload.sid === "string" ? payload.sid : null
  } catch {
    return null
  }
}

/** Cookie attributes the WorkOS callback sets. Host-only; no Domain attribute. */
export function buildAuthSessionCookies(input: {
  userId: string
  accessToken?: string | null
  nodeEnv: string
}): SessionCookie[] {
  const base: Omit<SessionCookie, "name" | "value"> = {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    secure: input.nodeEnv === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
  }
  const cookies: SessionCookie[] = [
    { name: SESSION_COOKIE, value: input.userId, ...base },
  ]
  const workosSessionId = getWorkOsSessionIdFromAccessToken(input.accessToken)
  if (workosSessionId) {
    cookies.push({
      name: WORKOS_SID_COOKIE,
      value: workosSessionId,
      ...base,
    })
  }
  return cookies
}
