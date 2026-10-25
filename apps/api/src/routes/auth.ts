import { Hono } from "hono"
import { deleteCookie, getCookie, setCookie } from "hono/cookie"
import {
  authenticateWithCode,
  ensureUserFromWorkOS,
  getAuthorizationUrl,
  getWorkOsLogoutUrl,
} from "../integrations/workos"
import { env } from "../lib/env"
import {
  buildAuthSessionCookies,
  SESSION_COOKIE,
  WORKOS_SID_COOKIE,
} from "../lib/session"

function clearAuthCookies(c: Parameters<typeof setCookie>[0]) {
  const { httpOnly, sameSite, path, secure } = buildAuthSessionCookies({
    userId: "",
    nodeEnv: env.NODE_ENV,
  })[0]!
  const cookieOptions = { httpOnly, sameSite, path, secure }
  deleteCookie(c, SESSION_COOKIE, cookieOptions)
  deleteCookie(c, WORKOS_SID_COOKIE, cookieOptions)
}

function applySessionCookies(
  c: Parameters<typeof setCookie>[0],
  userId: string,
  accessToken: string | null | undefined,
) {
  for (const cookie of buildAuthSessionCookies({
    userId,
    accessToken,
    nodeEnv: env.NODE_ENV,
  })) {
    setCookie(c, cookie.name, cookie.value, {
      httpOnly: cookie.httpOnly,
      sameSite: cookie.sameSite,
      path: cookie.path,
      secure: cookie.secure,
      maxAge: cookie.maxAge,
    })
  }
}

export const authRoutes = new Hono()
  .get("/login", (c) => {
    try {
      const redirectUri = `${env.API_URL}/auth/callback`
      const url = getAuthorizationUrl(redirectUri)
      return c.redirect(url)
    } catch {
      return c.redirect(`${env.DASHBOARD_URL}/signin?workos=unconfigured`)
    }
  })
  .get("/callback", async (c) => {
    const code = c.req.query("code")
    if (!code) return c.json({ error: "Missing code" }, 400)

    const result = await authenticateWithCode(code)
    const user = await ensureUserFromWorkOS({
      authId: result.user.id,
      email: result.user.email,
      name: [result.user.firstName, result.user.lastName]
        .filter(Boolean)
        .join(" "),
      profilePictureUrl: result.user.profilePictureUrl,
    })

    if (!user) return c.json({ error: "Failed to provision user" }, 500)

    applySessionCookies(c, user.id, result.accessToken)

    return c.redirect(env.DASHBOARD_URL)
  })
  .get("/logout", (c) => {
    const workosSessionId = getCookie(c, WORKOS_SID_COOKIE)
    clearAuthCookies(c)

    if (workosSessionId) {
      try {
        const logoutUrl = getWorkOsLogoutUrl(workosSessionId, env.DASHBOARD_URL)
        return c.redirect(logoutUrl)
      } catch (error) {
        console.error("Failed to build WorkOS logout URL", error)
      }
    }

    return c.redirect(env.DASHBOARD_URL)
  })
  .post("/logout", (c) => {
    clearAuthCookies(c)
    return c.json({ ok: true })
  })
