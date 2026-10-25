import { serve } from "@hono/node-server"
import { app } from "./app"
import { sqlitePath } from "./db/client"
import { startDevCron } from "./lib/dev-cron"
import { isE2EHarnessEnabled } from "./lib/e2e-harness"
import { env } from "./lib/env"

const port = env.PORT
console.log(`API listening on http://localhost:${port}`)
console.log(`SQLite: ${sqlitePath}`)

serve({
  fetch: app.fetch,
  port,
  hostname: isE2EHarnessEnabled() ? "127.0.0.1" : undefined,
})

startDevCron()

export default app
export type { AppType } from "./app"
