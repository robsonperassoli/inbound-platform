import { Hono } from "hono"
import { stripeWebhookRoutes } from "./stripe"
import { workosWebhookRoutes } from "./workos"

export const webhookRoutes = new Hono()
  .route("/stripe", stripeWebhookRoutes)
  .route("/workos", workosWebhookRoutes)
