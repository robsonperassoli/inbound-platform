import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { env } from "./lib/env"
import { sqlitePath } from "./db/client"
import { authRoutes, webhookRoutes } from "./routes/auth"
import { dashboardRoutes } from "./routes/dashboard"
import { publicRoutes } from "./routes/public"
import { teamRoutes } from "./routes/team"

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
      sqlitePath,
      env: env.NODE_ENV,
    }),
  )
  .route("/public", publicRoutes)
  .route("/auth", authRoutes)
  .route("/webhooks", webhookRoutes)
  .route("/", teamRoutes)
  .route("/", dashboardRoutes)

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
