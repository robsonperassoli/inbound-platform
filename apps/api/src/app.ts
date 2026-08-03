import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { env } from "./lib/env"
import { authRoutes } from "./routes/auth"
import { analyticsRoutes } from "./routes/analytics"
import { billingRoutes } from "./routes/billing"
import { formsRoutes } from "./routes/forms"
import { invitationsRoutes } from "./routes/invitations"
import { linksRoutes } from "./routes/links"
import { messagesRoutes } from "./routes/messages"
import { profilesRoutes } from "./routes/profiles"
import { publicRoutes } from "./routes/public"
import { supportRoutes } from "./routes/support"
import { teamRoutes } from "./routes/team"
import { threadsRoutes } from "./routes/threads"
import { uploadsRoutes } from "./routes/uploads"
import { usersRoutes } from "./routes/users"
import { webhookRoutes } from "./routes/webhooks"
import { internalRoutes } from "./routes/internal"

const app = new Hono()
  .use("*", logger())
  .use(
    "*",
    cors({
      origin: [
        env.DASHBOARD_URL,
        env.BIO_URL,
        "http://localhost:3000",
        "http://localhost:3001",
      ],
      credentials: true,
    }),
  )
  .get("/health", (c) =>
    c.json({
      ok: true,
      service: "api",
      env: env.NODE_ENV,
    }),
  )
  .route("/public", publicRoutes)
  .route("/auth", authRoutes)
  .route("/webhooks", webhookRoutes)
  .route("/internal", internalRoutes)
  .route("/", usersRoutes)
  .route("/", profilesRoutes)
  .route("/", linksRoutes)
  .route("/", formsRoutes)
  .route("/", threadsRoutes)
  .route("/", messagesRoutes)
  .route("/", uploadsRoutes)
  .route("/", billingRoutes)
  .route("/", analyticsRoutes)
  .route("/", supportRoutes)
  .route("/", teamRoutes)
  .route("/", invitationsRoutes)

app.onError((err, c) => {
  console.error(err)
  return c.json(
    {
      error: err instanceof Error ? err.message : "Internal Server Error",
    },
    500,
  )
})

export { app }
export type AppType = typeof app
export type { PricingPlanId } from "./lib/pricing"
