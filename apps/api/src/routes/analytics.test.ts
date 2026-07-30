import { beforeEach, describe, expect, it, vi } from "vitest"

const { getOverview, recordLinkClick, recordPageView } = vi.hoisted(() => ({
  getOverview: vi.fn(async () => ({
    overview: {
      total_page_views: 10,
      unique_visitors: 5,
      total_link_clicks: 2,
      average_ctr: 0.2,
    },
    linkClicks: [],
    deviceBreakdown: [],
    referrerBreakdown: [],
  })),
  recordLinkClick: vi.fn(async () => undefined),
  recordPageView: vi.fn(async () => undefined),
}))

vi.mock("../domains/analytics/index.ts", () => ({
  getOverview,
  recordLinkClick,
  recordPageView,
}))

import { createProfileForAccount } from "../test/factories"
import { client, withAuth } from "../test/http"

describe("analytics routes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns an overview payload", async () => {
    const { user, profile } = await createProfileForAccount({
      username: "analytics-page",
    })
    const res = await client.analytics.overview.$get(
      {
        query: {
          profileId: profile.id,
          startDate: "2026-01-01",
          endDate: "2026-01-31",
        },
      },
      withAuth(user.id),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({
      overview: {
        total_page_views: 10,
        unique_visitors: 5,
        total_link_clicks: 2,
        average_ctr: 0.2,
      },
      linkClicks: [],
      deviceBreakdown: [],
      referrerBreakdown: [],
    })
    expect(getOverview).toHaveBeenCalledWith({
      profileId: profile.id,
      startDate: "2026-01-01",
      endDate: "2026-01-31",
    })
  })
})
