import { Hono } from "hono"
import { deleteCookie, getCookie, setCookie } from "hono/cookie"
import {
  authenticateWithCode,
  ensureUserFromWorkOS,
  getAuthorizationUrl,
  getWorkOsLogoutUrl,
  getWorkOsSessionIdFromAccessToken,
} from "../integrations/workos"
import { parseE2EPersona, resolveE2ELoginUser } from "../lib/e2e-auth"
import { env } from "../lib/env"
import { isE2ELoginAllowed } from "../lib/e2e-harness"

const SESSION_COOKIE = "inbound_session"
const WORKOS_SID_COOKIE = "workos_sid"

function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "Lax" as const,
    path: "/",
    secure: env.NODE_ENV === "production",
  }
}

function clearAuthCookies(c: Parameters<typeof setCookie>[0]) {
  const cookieOptions = sessionCookieOptions()
  deleteCookie(c, SESSION_COOKIE, cookieOptions)
  deleteCookie(c, WORKOS_SID_COOKIE, cookieOptions)
}

export const authRoutes = new Hono()
  .get("/e2e-login", async (c) => {
    const allowed = isE2ELoginAllowed({
      parsedNodeEnv: env.NODE_ENV,
      liveNodeEnv: process.env.NODE_ENV,
      bypass: process.env.E2E_AUTH_BYPASS,
    })
    if (!allowed) {
      return c.json({ error: "Not found" }, 404)
    }

    try {
      const user = await resolveE2ELoginUser(
        parseE2EPersona(c.req.query("persona")),
      )
      setCookie(c, SESSION_COOKIE, user.id, {
        ...sessionCookieOptions(),
        maxAge: 60 * 60 * 24 * 30,
      })
      return c.redirect(env.DASHBOARD_URL)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "E2E login failed"
      if (message === "Seed user is not available") {
        return c.json({ error: message }, 500)
      }
      throw error
    }
  })
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

    const cookieOptions = sessionCookieOptions()

    setCookie(c, SESSION_COOKIE, user.id, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 30,
    })

    const workosSessionId = getWorkOsSessionIdFromAccessToken(
      result.accessToken,
    )
    if (workosSessionId) {
      setCookie(c, WORKOS_SID_COOKIE, workosSessionId, {
        ...cookieOptions,
        maxAge: 60 * 60 * 24 * 30,
      })
    }

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
