import { Hono } from "hono"

/** Scaffold for future WorkOS User Management / org webhooks. */
export const workosWebhookRoutes = new Hono().post("/", async (c) => {
  return c.json({ ok: true, received: true })
})
