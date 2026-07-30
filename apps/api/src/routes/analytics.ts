import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { z } from "zod"
import * as analytics from "../domains/analytics/index"
import { requireAuth } from "../middleware/auth"
import type { AuthContext } from "../middleware/auth"

export const analyticsRoutes = new Hono<{
  Variables: {
    auth: AuthContext
  }
}>()
  .use("*", requireAuth)
  .get(
    "/analytics/overview",
    zValidator(
      "query",
      z.object({
        profileId: z.string(),
        startDate: z.string(),
        endDate: z.string(),
      }),
    ),
    async (c) => {
      const { profileId, startDate, endDate } = c.req.valid("query")
      const payload = await analytics.getOverview({
        profileId,
        startDate,
        endDate,
      })
      return c.json(payload)
    },
  )
