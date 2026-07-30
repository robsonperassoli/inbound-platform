import * as chat from "../domains/chat/index"
import { env } from "./env"

const DEV_CRON_INTERVAL_MS = 60 * 1000

/** Local-only scheduler. Production uses Railway → HTTP cron endpoint. */
export function startDevCron() {
  if (env.NODE_ENV !== "development") return

  const tick = async () => {
    try {
      const result = await chat.autoCloseAbandonedThreads()
      if (result.closedSilent > 0 || result.closedAbandoned > 0) {
        console.info("[dev-cron] auto-close-threads", result)
      }
    } catch (error) {
      console.error("[dev-cron] auto-close-threads failed", error)
    }
  }

  console.info(
    `[dev-cron] auto-close-threads every ${DEV_CRON_INTERVAL_MS / 1000}s`,
  )
  void tick()
  setInterval(() => {
    void tick()
  }, DEV_CRON_INTERVAL_MS)
}
