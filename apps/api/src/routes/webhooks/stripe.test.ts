import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../../integrations/stripe.ts", () => ({
  handleStripeWebhook: vi.fn(async () => ({ received: true })),
  createCheckoutSession: vi.fn(),
  createCustomerPortalSession: vi.fn(),
  getStripe: vi.fn(),
  getOrCreateStripeCustomer: vi.fn(),
}))

import { handleStripeWebhook } from "../../integrations/stripe"
import { client } from "../../test/http"

describe("stripe webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 400 when the signature header is missing", async () => {
    const res = await client.webhooks.stripe.$post(undefined, {
      init: { body: "{}" },
    })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "Missing signature" })
    expect(handleStripeWebhook).not.toHaveBeenCalled()
  })

  it("forwards a signed payload to the Stripe handler", async () => {
    const res = await client.webhooks.stripe.$post(undefined, {
      headers: { "stripe-signature": "sig_test" },
      init: { body: '{"ok":true}' },
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ received: true })
    expect(handleStripeWebhook).toHaveBeenCalledWith('{"ok":true}', "sig_test")
  })
})
