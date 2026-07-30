import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { z } from "zod"
import { queryTinybirdEndpoint } from "../integrations/tinybird"
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

      const params = {
        profile_id: profileId,
        start_date: startDate,
        end_date: endDate,
      }

      const [overview, linkClicks, deviceBreakdown, referrerBreakdown] =
        await Promise.all([
          queryTinybirdEndpoint("overview", params),
          queryTinybirdEndpoint("link_clicks_by_link", {
            ...params,
            limit: "10",
            offset: "0",
          }),
          queryTinybirdEndpoint("device_breakdown", {
            ...params,
            limit: "10",
          }),
          queryTinybirdEndpoint("referrer_breakdown", {
            ...params,
            limit: "20",
          }),
        ])

      const overviewRow = overview.data?.[0] as
        | {
            total_page_views: number
            unique_visitors: number
            total_link_clicks: number
            average_ctr: number
          }
        | undefined

      return c.json({
        overview: overviewRow ?? null,
        linkClicks: (linkClicks.data ?? null) as Array<{
          link_id: string
          clicks: number
          unique_clickers: number
        }> | null,
        deviceBreakdown: (deviceBreakdown.data ?? null) as Array<{
          device: string
          views: number
          unique_visitors: number
        }> | null,
        referrerBreakdown: (referrerBreakdown.data ?? null) as Array<{
          referrer: string
          views: number
          unique_visitors: number
        }> | null,
      })
    },
  )
