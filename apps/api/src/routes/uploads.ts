import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { z } from "zod"
import { createUploadUrl } from "../integrations/storage"
import { requireAuth } from "../middleware/auth"
import type { AuthContext } from "../middleware/auth"

export const uploadsRoutes = new Hono<{
  Variables: {
    auth: AuthContext
  }
}>()
  .use("*", requireAuth)
  .post(
    "/uploads/presign",
    zValidator(
      "json",
      z.object({
        key: z.string(),
        contentType: z.string(),
      }),
    ),
    async (c) => {
      const body = c.req.valid("json")
      const url = await createUploadUrl(body.key, body.contentType)
      return c.json({ url, key: body.key })
    },
  )
