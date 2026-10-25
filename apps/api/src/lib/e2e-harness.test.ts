import { describe, expect, it } from "vitest"
import {
  insertLinkClick,
  insertPageView,
  queryDeviceBreakdown,
  queryLinkClicksByLink,
  queryOverview,
  queryReferrerBreakdown,
} from "../domains/analytics/repository"
import { sendEmail } from "../integrations/resend"
import { isStorageConfigured } from "../integrations/storage"
import { getStripe } from "../integrations/stripe"
import { isE2EHarnessEnabled, isE2ELoginAllowed } from "./e2e-harness"

describe("e2e harness guard", () => {
  it("is off when NODE_ENV is production", () => {
    expect(
      isE2ELoginAllowed({
        parsedNodeEnv: "production",
        liveNodeEnv: "development",
        bypass: "1",
      }),
    ).toBe(false)
    expect(
      isE2ELoginAllowed({
        parsedNodeEnv: "test",
        liveNodeEnv: "production",
        bypass: "1",
      }),
    ).toBe(false)
    expect(isE2EHarnessEnabled("production", "1")).toBe(false)
  })

  it("is on only outside production when the flag is 1", () => {
    expect(
      isE2ELoginAllowed({
        parsedNodeEnv: "test",
        liveNodeEnv: "test",
        bypass: "1",
      }),
    ).toBe(true)
    expect(isE2EHarnessEnabled("development", "1")).toBe(true)
    expect(isE2EHarnessEnabled("test", undefined)).toBe(false)
    expect(isE2EHarnessEnabled("development", "true")).toBe(false)
  })
})

describe("external service stubs", () => {
  const previous = {
    NODE_ENV: process.env.NODE_ENV,
    E2E_AUTH_BYPASS: process.env.E2E_AUTH_BYPASS,
  }

  async function withHarness(run: () => Promise<void>) {
    process.env.NODE_ENV = "test"
    process.env.E2E_AUTH_BYPASS = "1"
    try {
      await run()
    } finally {
      process.env.NODE_ENV = previous.NODE_ENV
      if (previous.E2E_AUTH_BYPASS === undefined) {
        delete process.env.E2E_AUTH_BYPASS
      } else {
        process.env.E2E_AUTH_BYPASS = previous.E2E_AUTH_BYPASS
      }
    }
  }

  it("does not call Stripe, Resend, B2, or Tinybird", async () => {
    await withHarness(async () => {
      expect(getStripe()).toBeNull()
      expect(isStorageConfigured()).toBe(false)
      await expect(
        sendEmail({
          to: "visitor@example.com",
          subject: "Hello",
          text: "Hello",
          from: "Inbound <noreply@example.com>",
        }),
      ).resolves.toEqual({ id: "dev-email" })

      const pageView = {
        profile_id: "profile",
        visitor_id: "visitor",
        timestamp: "2026-01-01 00:00:00",
        referrer: null,
        referrer_name: null,
        device: "desktop",
      }
      await expect(insertPageView(pageView)).resolves.toBeUndefined()
      await expect(
        insertLinkClick({
          profile_id: "profile",
          visitor_id: "visitor",
          link_id: "link",
          timestamp: "2026-01-01 00:00:00",
        }),
      ).resolves.toBeUndefined()

      const range = {
        profile_id: "profile",
        start_date: "2026-01-01 00:00:00",
        end_date: "2026-01-02 00:00:00",
      }
      await expect(queryOverview(range)).resolves.toEqual({ data: [] })
      await expect(
        queryLinkClicksByLink({ ...range, limit: 10, offset: 0 }),
      ).resolves.toEqual({ data: [] })
      await expect(
        queryDeviceBreakdown({ ...range, limit: 10 }),
      ).resolves.toEqual({ data: [] })
      await expect(
        queryReferrerBreakdown({ ...range, limit: 10 }),
      ).resolves.toEqual({ data: [] })
    })
  })
})
