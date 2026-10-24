import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../../integrations/tinybird.ts", () => {
  const pageViewsIngest = vi.fn()
  const linkClicksIngest = vi.fn()
  const overviewQuery = vi.fn()
  const linkClicksByLinkQuery = vi.fn()
  const deviceBreakdownQuery = vi.fn()
  const referrerBreakdownQuery = vi.fn()

  return {
    pageViewsIngest,
    linkClicksIngest,
    overviewQuery,
    linkClicksByLinkQuery,
    deviceBreakdownQuery,
    referrerBreakdownQuery,
    tinybird: {
      pageViews: { ingest: pageViewsIngest },
      linkClicks: { ingest: linkClicksIngest },
      overview: { query: overviewQuery },
      linkClicksByLink: { query: linkClicksByLinkQuery },
      deviceBreakdown: { query: deviceBreakdownQuery },
      referrerBreakdown: { query: referrerBreakdownQuery },
    },
  }
})

import * as tinybirdModule from "../../integrations/tinybird"
import { getOverview, recordLinkClick, recordPageView } from "./index"
import * as repository from "./repository"

const {
  pageViewsIngest,
  linkClicksIngest,
  overviewQuery,
  linkClicksByLinkQuery,
  deviceBreakdownQuery,
  referrerBreakdownQuery,
} = tinybirdModule as unknown as {
  pageViewsIngest: ReturnType<typeof vi.fn>
  linkClicksIngest: ReturnType<typeof vi.fn>
  overviewQuery: ReturnType<typeof vi.fn>
  linkClicksByLinkQuery: ReturnType<typeof vi.fn>
  deviceBreakdownQuery: ReturnType<typeof vi.fn>
  referrerBreakdownQuery: ReturnType<typeof vi.fn>
}

describe("analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("writes a page view with a Tinybird timestamp", async () => {
    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(new Date("2026-01-02T03:04:05.678Z"))
    pageViewsIngest.mockResolvedValue({ successful_rows: 1 })

    try {
      const result = await recordPageView({
        profileId: "profile_1",
        visitorId: "visitor_1",
        referrer: "https://example.com",
        referrerName: "Example",
        device: "mobile",
      })

      expect(result).toEqual({ successful_rows: 1 })
      expect(pageViewsIngest).toHaveBeenCalledWith({
        profile_id: "profile_1",
        visitor_id: "visitor_1",
        timestamp: "2026-01-02 03:04:05",
        referrer: "https://example.com",
        referrer_name: "Example",
        device: "mobile",
      })
    } finally {
      vi.useRealTimers()
    }
  })

  it("defaults empty page-view dimensions and keeps a caller timestamp", async () => {
    pageViewsIngest.mockResolvedValue({})

    await recordPageView({
      profileId: "profile_1",
      visitorId: "visitor_1",
      timestamp: "2026-04-05 06:07:08",
    })

    expect(pageViewsIngest).toHaveBeenCalledWith({
      profile_id: "profile_1",
      visitor_id: "visitor_1",
      timestamp: "2026-04-05 06:07:08",
      referrer: null,
      referrer_name: null,
      device: null,
    })
  })

  it("writes a link click", async () => {
    linkClicksIngest.mockResolvedValue({ successful_rows: 1 })

    await recordLinkClick({
      profileId: "profile_1",
      visitorId: "visitor_1",
      linkId: "link_1",
      timestamp: "2026-04-05 06:07:08",
    })

    expect(linkClicksIngest).toHaveBeenCalledWith({
      profile_id: "profile_1",
      visitor_id: "visitor_1",
      link_id: "link_1",
      timestamp: "2026-04-05 06:07:08",
    })
  })

  it("returns null breakdowns when Tinybird rows are missing", async () => {
    overviewQuery.mockResolvedValue({ data: [] })
    linkClicksByLinkQuery.mockResolvedValue({})
    deviceBreakdownQuery.mockResolvedValue({})
    referrerBreakdownQuery.mockResolvedValue({})

    const result = await getOverview({
      profileId: "profile_1",
      startDate: "2026-01-01 00:00:00",
      endDate: "2026-01-31 00:00:00",
    })

    expect(result).toEqual({
      overview: null,
      linkClicks: null,
      deviceBreakdown: null,
      referrerBreakdown: null,
    })
    expect(linkClicksByLinkQuery).toHaveBeenCalledWith({
      profile_id: "profile_1",
      start_date: "2026-01-01 00:00:00",
      end_date: "2026-01-31 00:00:00",
      limit: 10,
      offset: 0,
    })
    expect(deviceBreakdownQuery).toHaveBeenCalledWith({
      profile_id: "profile_1",
      start_date: "2026-01-01 00:00:00",
      end_date: "2026-01-31 00:00:00",
      limit: 10,
    })
    expect(referrerBreakdownQuery).toHaveBeenCalledWith({
      profile_id: "profile_1",
      start_date: "2026-01-01 00:00:00",
      end_date: "2026-01-31 00:00:00",
      limit: 20,
    })
  })

  it("returns the first overview row and breakdown data", async () => {
    const overview = { total_page_views: 4, unique_visitors: 2 }
    overviewQuery.mockResolvedValue({ data: [overview] })
    linkClicksByLinkQuery.mockResolvedValue({
      data: [{ link_id: "link_1", clicks: 3 }],
    })
    deviceBreakdownQuery.mockResolvedValue({
      data: [{ device: "desktop", views: 4 }],
    })
    referrerBreakdownQuery.mockResolvedValue({
      data: [{ referrer: "direct", views: 4 }],
    })

    await expect(
      repository.queryOverview({
        profile_id: "profile_1",
        start_date: "2026-01-01 00:00:00",
        end_date: "2026-01-31 00:00:00",
      }),
    ).resolves.toEqual({ data: [overview] })

    const result = await getOverview({
      profileId: "profile_1",
      startDate: "2026-01-01 00:00:00",
      endDate: "2026-01-31 00:00:00",
    })

    expect(result).toEqual({
      overview,
      linkClicks: [{ link_id: "link_1", clicks: 3 }],
      deviceBreakdown: [{ device: "desktop", views: 4 }],
      referrerBreakdown: [{ referrer: "direct", views: 4 }],
    })
  })
})
