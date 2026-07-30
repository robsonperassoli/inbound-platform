import { Hono } from "hono"
import * as chat from "../domains/chat/index"
import { env } from "../lib/env"

function authorizeCron(authorization: string | undefined) {
  if (authorization !== `Bearer ${env.CRON_SECRET}`) {
    return { ok: false as const, status: 401 as const, error: "Unauthorized" }
  }

  return { ok: true as const }
}

export const internalRoutes = new Hono().post(
  "/cron/auto-close-threads",
  async (c) => {
    const auth = authorizeCron(c.req.header("Authorization"))
    if (!auth.ok) {
      return c.json({ error: auth.error }, auth.status)
    }

    const result = await chat.autoCloseAbandonedThreads()
    return c.json({ ok: true, ...result })
  },
)
