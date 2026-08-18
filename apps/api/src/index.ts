import { serve } from "@hono/node-server"
import { app } from "./app"
import { sqlitePath } from "./db/client"
import { applyMigrations } from "./db/migrate"
import { startDevCron } from "./lib/dev-cron"
import { env } from "./lib/env"

applyMigrations()

const port = env.PORT
console.log(`API listening on http://localhost:${port}`)
console.log(`SQLite: ${sqlitePath}`)

serve({
  fetch: app.fetch,
  port,
})

startDevCron()

export default app
export type { AppType } from "./app"
