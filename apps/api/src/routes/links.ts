import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { z } from "zod"
import * as profiles from "../domains/profiles/index"
import { requireAuth } from "../middleware/auth"
import type { AuthContext } from "../middleware/auth"

const updateLinkBodySchema = z.object({
  title: z.string().optional(),
  url: z.string().nullable().optional(),
  order: z.number().optional(),
  active: z.boolean().optional(),
  platform: z
    .enum(["instagram", "tiktok", "x", "youtube", "facebook", "linkedin"])
    .nullable()
    .optional(),
  formId: z.string().nullable().optional(),
})

export const linksRoutes = new Hono<{
  Variables: {
    auth: AuthContext
  }
}>()
  .use("*", requireAuth)
  .patch("/links/:id", zValidator("json", updateLinkBodySchema), async (c) => {
    const auth = c.get("auth")
    const body = c.req.valid("json")

    const link = await profiles.updateLinkForUser(
      c.req.param("id"),
      auth.user.id,
      body,
    )
    if (!link) return c.json({ error: "Not found" }, 404)
    return c.json({ link })
  })
  .delete("/links/:id", async (c) => {
    const auth = c.get("auth")
    const ok = await profiles.deleteLinkForUser(c.req.param("id"), auth.user.id)
    if (!ok) return c.json({ error: "Not found" }, 404)
    return c.json({ ok: true })
  })
