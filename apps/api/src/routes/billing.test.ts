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

vi.mock("../domains/emails/index.ts", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../domains/emails/index.ts")>()
  return {
    ...actual,
    sendSalesLeadEmail: vi.fn(async () => ({ id: "dev-sales" })),
    sendActivationEmail: vi.fn(async () => ({ id: "dev-email" })),
  }
})

import { sendSalesLeadEmail } from "../domains/emails/index"
import { createCheckoutSession } from "../integrations/stripe"
import {
  createProfileForAccount,
  createUserAccount,
} from "../test/factories"
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

  it("submits a team sales lead", async () => {
    const { user, account } = await createUserAccount({
      name: "Sales Lead",
    })
    const { profile } = await createProfileForAccount({
      userId: user.id,
      accountId: account.id,
      username: "sales-lead",
    })

    const res = await client.billing["sales-lead"].$post(
      {
        json: {
          email: "lead@acme.com",
          phone: "+15551212",
          companyName: "Acme",
          profileId: profile.id,
          userAgent: "vitest",
        },
      },
      withAuth(user.id),
    )

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, email: "lead@acme.com" })
    expect(sendSalesLeadEmail).toHaveBeenCalledWith({
      email: "lead@acme.com",
      phone: "+15551212",
      companyName: "Acme",
      leadName: "Sales Lead",
      username: "sales-lead",
      userAgent: "vitest",
    })
  })
})
