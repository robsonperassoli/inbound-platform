import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../integrations/tinybird.ts", () => ({
  queryTinybirdEndpoint: vi.fn(async (name: string) => {
    if (name === "overview") {
      return {
        data: [
          {
            total_page_views: 10,
            unique_visitors: 5,
            total_link_clicks: 2,
            average_ctr: 0.2,
          },
        ],
      }
    }
    return { data: [] }
  }),
  ingestLinkClick: vi.fn(),
  ingestPageView: vi.fn(),
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
  })
})
