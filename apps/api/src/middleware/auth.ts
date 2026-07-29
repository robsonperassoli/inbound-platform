import { createMiddleware } from "hono/factory"
import { getCookie } from "hono/cookie"
import * as accounts from "../domains/accounts/index.ts"
import type { User } from "../db/schema.ts"

export type AuthContext = {
  user: User
  account: accounts.AuthScope["account"]
  membership: accounts.AuthScope["membership"]
}

type Variables = {
  auth: AuthContext
}

export const requireAuth = createMiddleware<{ Variables: Variables }>(
  async (c, next) => {
    const sessionUserId = getCookie(c, "inbound_session")
    if (!sessionUserId) {
      return c.json({ error: "Unauthorized" }, 401)
    }

    const result = await accounts.getAuthScope(sessionUserId)
    if (!result.ok) {
      if (result.reason === "unauthorized") {
        return c.json({ error: "Unauthorized" }, 401)
      }
      if (result.reason === "no_membership") {
        return c.json({ error: "No account membership" }, 403)
      }
      return c.json({ error: "Account not found" }, 403)
    }

    c.set("auth", {
      user: result.scope.user,
      account: result.scope.account,
      membership: result.scope.membership,
    })
    await next()
  },
)
