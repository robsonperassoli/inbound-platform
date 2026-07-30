import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { z } from "zod"
import * as agents from "../domains/agents/index"
import * as chat from "../domains/chat/index"
import { requireAuth } from "../middleware/auth"
import type { AuthContext } from "../middleware/auth"

export const messagesRoutes = new Hono<{
  Variables: {
    auth: AuthContext
  }
}>()
  .use("*", requireAuth)
  .get("/threads/:id/messages", async (c) => {
    const auth = c.get("auth")
    const data = await chat.getThreadWithMessages(
      c.req.param("id"),
      auth.user.id,
    )
    if (!data) return c.json({ error: "Not found" }, 404)
    return c.json(data)
  })
  .post(
    "/threads/:id/messages",
    zValidator("json", z.object({ message: z.string().min(1) })),
    async (c) => {
      const auth = c.get("auth")
      const thread = await chat.getThreadForUser(c.req.param("id"), auth.user.id)
      if (!thread) return c.json({ error: "Not found" }, 404)

      const body = c.req.valid("json")
      await agents.sendThreadMessage({
        threadId: thread.id,
        message: body.message,
      })
      return c.json({ ok: true })
    },
  )
