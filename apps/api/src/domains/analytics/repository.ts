import {
  type LinkClickRow,
  type PageViewsRow,
  tinybird,
} from "../../integrations/tinybird"
import { isE2EHarnessEnabled } from "../../lib/e2e-harness"

const emptyAnalytics = { data: [] }

export async function insertPageView(row: PageViewsRow) {
  if (isE2EHarnessEnabled()) return
  return tinybird.pageViews.ingest(row)
}

export async function insertLinkClick(row: LinkClickRow) {
  if (isE2EHarnessEnabled()) return
  return tinybird.linkClicks.ingest(row)
}

export async function queryOverview(params: {
  profile_id: string
  start_date: string
  end_date: string
}) {
  if (isE2EHarnessEnabled()) return emptyAnalytics
  return tinybird.overview.query(params)
}

export async function queryLinkClicksByLink(params: {
  profile_id: string
  start_date: string
  end_date: string
  limit: number
  offset: number
}) {
  if (isE2EHarnessEnabled()) return emptyAnalytics
  return tinybird.linkClicksByLink.query(params)
}

export async function queryDeviceBreakdown(params: {
  profile_id: string
  start_date: string
  end_date: string
  limit: number
}) {
  if (isE2EHarnessEnabled()) return emptyAnalytics
  return tinybird.deviceBreakdown.query(params)
}

export async function queryReferrerBreakdown(params: {
  profile_id: string
  start_date: string
  end_date: string
  limit: number
}) {
  if (isE2EHarnessEnabled()) return emptyAnalytics
  return tinybird.referrerBreakdown.query(params)
}
