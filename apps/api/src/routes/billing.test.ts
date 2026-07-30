import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../integrations/stripe.ts", () => ({
  createCheckoutSession: vi.fn(async () => ({
    sessionId: "cs_test",
    url: "https://checkout.example.com/session",
  })),
  createCustomerPortalSession: vi.fn(async () => null),
  handleStripeWebhook: vi.fn(),
  getStripe: vi.fn(),
  getOrCreateStripeCustomer: vi.fn(),
}))

import { createCheckoutSession } from "../integrations/stripe"
import { createUserAccount } from "../test/factories"
import { client, withAuth } from "../test/http"

describe("billing routes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("starts a checkout session", async () => {
    const { user } = await createUserAccount()
    const res = await client.billing.checkout.$post(
      { json: { plan: "starter", cycle: "yearly" } },
      withAuth(user.id),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      sessionId: "cs_test",
      url: "https://checkout.example.com/session",
    })
    expect(createCheckoutSession).toHaveBeenCalled()
  })

  it("returns 404 for portal when there is no customer", async () => {
    const { user } = await createUserAccount()
    const res = await client.billing.portal.$post({}, withAuth(user.id))
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "No customer" })
  })
})
