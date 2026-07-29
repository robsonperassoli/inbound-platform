import { api } from "./client"

export type AnalyticsOverview = {
  linkClicks: Array<{
    link_id: string
    clicks: number
    unique_clickers: number
  }> | null
  overview: {
    total_page_views: number
    unique_visitors: number
    total_link_clicks: number
    average_ctr: number
  } | null
  deviceBreakdown: Array<{
    device: string
    views: number
    unique_visitors: number
  }> | null
  referrerBreakdown: Array<{
    referrer: string
    views: number
    unique_visitors: number
  }> | null
}

export async function analyticsOverview(params: {
  profileId: string
  startDate: string
  endDate: string
}): Promise<AnalyticsOverview> {
  const q = new URLSearchParams(params)
  const data = await api<{
    linkClicks?: AnalyticsOverview["linkClicks"]
    overview?: AnalyticsOverview["overview"]
    deviceBreakdown?: AnalyticsOverview["deviceBreakdown"]
    referrerBreakdown?: AnalyticsOverview["referrerBreakdown"]
  }>(`/analytics/overview?${q}`)

  return {
    linkClicks: data.linkClicks ?? null,
    overview: data.overview ?? null,
    deviceBreakdown: data.deviceBreakdown ?? null,
    referrerBreakdown: data.referrerBreakdown ?? null,
  }
}
