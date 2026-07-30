import { Hono } from "hono"
import * as accounts from "../domains/accounts/index"
import * as billing from "../domains/billing/index"
import { getPlanIdForPriceId } from "../lib/pricing"
import { requireAuth } from "../middleware/auth"
import type { AuthContext } from "../middleware/auth"

export const usersRoutes = new Hono<{
  Variables: {
    auth: AuthContext
  }
}>()
  .use("*", requireAuth)
  .get("/me", async (c) => {
    const auth = c.get("auth")

    const [isSuperUser, billingState] = await Promise.all([
      accounts.isSuperUser(auth.user.id),
      billing.getMeBillingState(auth.account.id, auth.account.type),
    ])

    return c.json({
      user: auth.user,
      account: auth.account,
      membership: auth.membership,
      subscribed: billingState.subscribed,
      plan:
        auth.account.type === "team"
          ? "team"
          : getPlanIdForPriceId(billingState.subscription?.priceId),
      isSuperUser,
    })
  })
  .get("/system/users", async (c) => {
    const auth = c.get("auth")
    if (!(await accounts.isSuperUser(auth.user.id))) {
      return c.json({ error: "Forbidden" }, 403)
    }

    const users = await accounts.listSystemUsers()
    return c.json({ users })
  })
