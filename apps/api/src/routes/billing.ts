import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { z } from "zod"
import {
  createCheckoutSession,
  createCustomerPortalSession,
} from "../integrations/stripe"
import { getStripePriceId } from "../lib/pricing"
import { requireAuth } from "../middleware/auth"
import type { AuthContext } from "../middleware/auth"

export const billingRoutes = new Hono<{
  Variables: {
    auth: AuthContext
  }
}>()
  .use("*", requireAuth)
  .post(
    "/billing/checkout",
    zValidator(
      "json",
      z.object({
        plan: z.enum(["starter", "pro"]),
        cycle: z.enum(["monthly", "yearly"]).default("yearly"),
      }),
    ),
    async (c) => {
      const auth = c.get("auth")
      const body = c.req.valid("json")

      let priceId: string
      try {
        priceId = getStripePriceId(body.plan, body.cycle)
      } catch (error) {
        return c.json(
          {
            error:
              error instanceof Error ? error.message : "Price not configured",
          },
          400,
        )
      }

      const session = await createCheckoutSession({
        accountId: auth.account.id,
        userId: auth.user.id,
        email: auth.user.email,
        name: auth.user.name,
        priceId,
        planType: body.plan,
      })
      return c.json(session)
    },
  )
  .post("/billing/portal", async (c) => {
    const auth = c.get("auth")
    const session = await createCustomerPortalSession(auth.account.id)
    if (!session) return c.json({ error: "No customer" }, 404)
    return c.json(session)
  })
