import { Hono } from "hono"
import { handleStripeWebhook } from "../../integrations/stripe"

export const stripeWebhookRoutes = new Hono().post("/", async (c) => {
  const signature = c.req.header("stripe-signature")
  if (!signature) return c.json({ error: "Missing signature" }, 400)
  const rawBody = await c.req.text()
  const result = await handleStripeWebhook(rawBody, signature)
  return c.json(result)
})
