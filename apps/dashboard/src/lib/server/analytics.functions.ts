import { apiClient } from "@/lib/api"

export async function getOverview(params: {
  profileId: string
  start: string
  end: string
}) {
  const data = (await apiClient.analyticsOverview({
    profileId: params.profileId,
    startDate: params.start,
    endDate: params.end,
  })) as {
    linkClicks?: Array<{
      link_id: string
      clicks: number
      unique_clickers: number
    }> | null
    overview?: {
      total_page_views: number
      unique_visitors: number
      total_link_clicks: number
      average_ctr: number
    } | null
    deviceBreakdown?: Array<{
      device: string
      views: number
      unique_visitors: number
    }> | null
    referrerBreakdown?: Array<{
      referrer: string
      views: number
      unique_visitors: number
    }> | null
  }

  return {
    linkClicks: data.linkClicks ?? null,
    overview: data.overview ?? null,
    deviceBreakdown: data.deviceBreakdown ?? null,
    referrerBreakdown: data.referrerBreakdown ?? null,
  }
}
