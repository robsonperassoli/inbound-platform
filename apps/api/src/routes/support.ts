import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { z } from "zod"
import { sendSupportEmail } from "../integrations/resend"
import { requireAuth } from "../middleware/auth"
import type { AuthContext } from "../middleware/auth"

export const supportRoutes = new Hono<{
  Variables: {
    auth: AuthContext
  }
}>()
  .use("*", requireAuth)
  .post(
    "/support",
    zValidator("json", z.object({ message: z.string().min(1) })),
    async (c) => {
      const auth = c.get("auth")
      const body = c.req.valid("json")
      await sendSupportEmail({
        fromEmail: auth.user.email ?? "unknown@inbound.click",
        message: body.message,
      })
      return c.json({ ok: true })
    },
  )
  .post(
    "/feedback",
    zValidator("json", z.object({ message: z.string().min(1) })),
    async (c) => {
      const auth = c.get("auth")
      const body = c.req.valid("json")
      await sendSupportEmail({
        fromEmail: auth.user.email ?? "unknown@inbound.click",
        message: `[Feedback]\n${body.message}`,
      })
      return c.json({ ok: true })
    },
  )
