import { describe, expect, it, vi } from "vitest"

vi.mock("@tinybirdco/sdk", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tinybirdco/sdk")>()
  return {
    ...actual,
    Tinybird: vi.fn(function Tinybird(
      this: { options: unknown },
      options: unknown,
    ) {
      this.options = options
    }),
  }
})

import { Tinybird } from "@tinybirdco/sdk"
import {
  deviceBreakdown,
  linkClicks,
  linkClicksByLink,
  overview,
  pageViews,
  referrerBreakdown,
  tinybird,
} from "./tinybird"

describe("tinybird definitions", () => {
  it("registers page views, link clicks, and the analytics pipes", () => {
    expect(pageViews).toBeTruthy()
    expect(linkClicks).toBeTruthy()
    expect(overview).toBeTruthy()
    expect(linkClicksByLink).toBeTruthy()
    expect(deviceBreakdown).toBeTruthy()
    expect(referrerBreakdown).toBeTruthy()

    expect(Tinybird).toHaveBeenCalledTimes(1)
    expect(Tinybird).toHaveBeenCalledWith({
      datasources: { pageViews, linkClicks },
      pipes: {
        overview,
        linkClicksByLink,
        referrerBreakdown,
        deviceBreakdown,
      },
    })
    expect(tinybird).toBe(vi.mocked(Tinybird).mock.instances[0])
  })
})
