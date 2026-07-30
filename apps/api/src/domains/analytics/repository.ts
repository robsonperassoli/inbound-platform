import {
  type LinkClickRow,
  type PageViewsRow,
  tinybird,
} from "../../integrations/tinybird"

export async function insertPageView(row: PageViewsRow) {
  return tinybird.pageViews.ingest(row)
}

export async function insertLinkClick(row: LinkClickRow) {
  return tinybird.linkClicks.ingest(row)
}

export async function queryOverview(params: {
  profile_id: string
  start_date: string
  end_date: string
}) {
  return tinybird.overview.query(params)
}

export async function queryLinkClicksByLink(params: {
  profile_id: string
  start_date: string
  end_date: string
  limit: number
  offset: number
}) {
  return tinybird.linkClicksByLink.query(params)
}

export async function queryDeviceBreakdown(params: {
  profile_id: string
  start_date: string
  end_date: string
  limit: number
}) {
  return tinybird.deviceBreakdown.query(params)
}

export async function queryReferrerBreakdown(params: {
  profile_id: string
  start_date: string
  end_date: string
  limit: number
}) {
  return tinybird.referrerBreakdown.query(params)
}
