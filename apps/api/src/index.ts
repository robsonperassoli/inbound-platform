import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { env } from "./lib/env.ts"
import { sqlitePath } from "./db/client.ts"
import { authRoutes, webhookRoutes } from "./routes/auth.ts"
import { dashboardRoutes } from "./routes/dashboard.ts"
import { publicRoutes } from "./routes/public.ts"
import { teamRoutes } from "./routes/team.ts"

const app = new Hono()

app.use("*", logger())
app.use(
  "*",
  cors({
    origin: [env.DASHBOARD_URL, env.BIO_URL, "http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  }),
)

app.get("/health", (c) =>
  c.json({
    ok: true,
    service: "api",
    sqlitePath,
    env: env.NODE_ENV,
  }),
)

app.route("/public", publicRoutes)
app.route("/auth", authRoutes)
app.route("/webhooks", webhookRoutes)
app.route("/", teamRoutes)
app.route("/", dashboardRoutes)

app.onError((err, c) => {
  console.error(err)
  return c.json(
    {
      error: err instanceof Error ? err.message : "Internal Server Error",
    },
    500,
  )
})

const port = env.PORT
console.log(`API listening on http://localhost:${port}`)
console.log(`SQLite: ${sqlitePath}`)

serve({
  fetch: app.fetch,
  port,
})

export default app
