import type { InferResponseType } from "hono/client"
import { ApiError, client } from "./client"

export type AnalyticsOverview = InferResponseType<
  typeof client.analytics.overview.$get,
  200
>

export async function analyticsOverview(params: {
  profileId: string
  startDate: string
  endDate: string
}): Promise<AnalyticsOverview> {
  const res = await client.analytics.overview.$get({
    query: params,
  })
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  const data = await res.json()
  return {
    linkClicks: data.linkClicks ?? null,
    overview: data.overview ?? null,
    deviceBreakdown: data.deviceBreakdown ?? null,
    referrerBreakdown: data.referrerBreakdown ?? null,
  }
}
