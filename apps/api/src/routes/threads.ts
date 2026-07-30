import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { z } from "zod"
import * as chat from "../domains/chat/index"
import { requireAuth } from "../middleware/auth"
import type { AuthContext } from "../middleware/auth"

export const threadsRoutes = new Hono<{
  Variables: {
    auth: AuthContext
  }
}>()
  .use("*", requireAuth)
  .post(
    "/threads/theme-designer",
    zValidator("json", z.object({ profileId: z.string() })),
    async (c) => {
      const auth = c.get("auth")
      const body = c.req.valid("json")
      const threadId = await chat.startThemeDesignerThread({
        userId: auth.user.id,
        profileId: body.profileId,
      })
      return c.json({ threadId }, 201)
    },
  )
  .post(
    "/threads/form-builder",
    zValidator("json", z.object({ profileId: z.string().optional() })),
    async (c) => {
      const auth = c.get("auth")
      const body = c.req.valid("json")
      const threadId = await chat.startFormBuilderThread({
        userId: auth.user.id,
        profileId: body.profileId,
      })
      return c.json({ threadId }, 201)
    },
  )
