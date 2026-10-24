import { afterEach, describe, expect, it } from "vitest"
import { env } from "./env"
import { getPlanIdForPriceId, getStripePriceId } from "./pricing"

const previous = {
  STRIPE_STARTER_PRICE_ID: env.STRIPE_STARTER_PRICE_ID,
  STRIPE_STARTER_PRICE_YEARLY_ID: env.STRIPE_STARTER_PRICE_YEARLY_ID,
  STRIPE_PRO_PRICE_ID: env.STRIPE_PRO_PRICE_ID,
  STRIPE_PRO_PRICE_YEARLY_ID: env.STRIPE_PRO_PRICE_YEARLY_ID,
}

describe("pricing", () => {
  afterEach(() => {
    env.STRIPE_STARTER_PRICE_ID = previous.STRIPE_STARTER_PRICE_ID
    env.STRIPE_STARTER_PRICE_YEARLY_ID = previous.STRIPE_STARTER_PRICE_YEARLY_ID
    env.STRIPE_PRO_PRICE_ID = previous.STRIPE_PRO_PRICE_ID
    env.STRIPE_PRO_PRICE_YEARLY_ID = previous.STRIPE_PRO_PRICE_YEARLY_ID
  })

  it("returns the configured Stripe price for a plan and cycle", () => {
    expect(getStripePriceId("starter", "monthly")).toBe("price_starter_monthly")
    expect(getStripePriceId("starter", "yearly")).toBe("price_starter_yearly")
    expect(getStripePriceId("pro", "monthly")).toBe("price_pro_monthly")
    expect(getStripePriceId("pro", "yearly")).toBe("price_pro_yearly")
  })

  it("throws when a price id is not configured", () => {
    env.STRIPE_PRO_PRICE_YEARLY_ID = undefined

    expect(() => getStripePriceId("pro", "yearly")).toThrow(
      /STRIPE_PRO_PRICE_YEARLY_ID/,
    )
  })

  it("maps a Stripe price back to a plan, or free", () => {
    expect(getPlanIdForPriceId(null)).toBe("free")
    expect(getPlanIdForPriceId(undefined)).toBe("free")
    expect(getPlanIdForPriceId("price_unknown")).toBe("free")
    expect(getPlanIdForPriceId("price_starter_monthly")).toBe("starter")
    expect(getPlanIdForPriceId("price_starter_yearly")).toBe("starter")
    expect(getPlanIdForPriceId("price_pro_monthly")).toBe("pro")
    expect(getPlanIdForPriceId("price_pro_yearly")).toBe("pro")
  })
})
