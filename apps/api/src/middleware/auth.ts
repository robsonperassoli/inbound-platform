import { createMiddleware } from "hono/factory"
import { getCookie } from "hono/cookie"
import { eq } from "drizzle-orm"
import { db } from "../db/client.ts"
import { accountMembers, accounts, users, type User } from "../db/schema.ts"

export type AuthContext = {
  user: User
  account: typeof accounts.$inferSelect
  membership: typeof accountMembers.$inferSelect
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

    const user = await db.query.users.findFirst({
      where: eq(users.id, sessionUserId),
    })
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401)
    }

    const membership = await db.query.accountMembers.findFirst({
      where: eq(accountMembers.userId, user.id),
    })
    if (!membership) {
      return c.json({ error: "No account membership" }, 403)
    }

    const account = await db.query.accounts.findFirst({
      where: eq(accounts.id, membership.accountId),
    })
    if (!account) {
      return c.json({ error: "Account not found" }, 403)
    }

    c.set("auth", { user, account, membership })
    await next()
  },
)
