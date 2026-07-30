import { describe, expect, it } from "vitest"
import type Stripe from "stripe"
import * as accounts from "../domains/accounts/index"
import * as billing from "../domains/billing/index"
import { createUserAccount } from "../test/factories"
import { processStripeEvent } from "./stripe"

function customerEvent(
  type: "customer.created" | "customer.updated",
  customer: Partial<Stripe.Customer> & { id: string },
): Stripe.Event {
  return {
    id: "evt_customer",
    object: "event",
    type,
    data: {
      object: {
        object: "customer",
        email: null,
        metadata: {},
        ...customer,
      } as Stripe.Customer,
    },
  } as Stripe.Event
}

function subscriptionEvent(
  type:
    | "customer.subscription.created"
    | "customer.subscription.updated"
    | "customer.subscription.deleted",
  subscription: {
    id: string
    customer: string
    status?: Stripe.Subscription.Status
    metadata?: Record<string, string>
    priceId?: string
    currentPeriodEnd?: number
  },
): Stripe.Event {
  const currentPeriodEnd = subscription.currentPeriodEnd ?? 1_700_000_000
  return {
    id: "evt_subscription",
    object: "event",
    type,
    data: {
      object: {
        object: "subscription",
        id: subscription.id,
        customer: subscription.customer,
        status: subscription.status ?? "active",
        metadata: subscription.metadata ?? {},
        items: {
          object: "list",
          data: [
            {
              id: "si_1",
              object: "subscription_item",
              current_period_end: currentPeriodEnd,
              price: {
                id: subscription.priceId ?? "price_1",
                object: "price",
              },
            },
          ],
        },
      } as unknown as Stripe.Subscription,
    },
  } as Stripe.Event
}

describe("processStripeEvent", () => {
  it("mirrors a customer without metadata as an unlinked row", async () => {
    await processStripeEvent(
      customerEvent("customer.created", {
        id: "cus_unlinked",
        email: "unlinked@example.com",
      }),
    )

    const customer =
      await billing.getCustomerByStripeCustomerId("cus_unlinked")
    expect(customer).toMatchObject({
      stripeCustomerId: "cus_unlinked",
      email: "unlinked@example.com",
      accountId: null,
      userId: null,
    })
  })

  it("mirrors a subscription without metadata as an unlinked row", async () => {
    await processStripeEvent(
      subscriptionEvent("customer.subscription.created", {
        id: "sub_unlinked",
        customer: "cus_from_sub",
        status: "active",
      }),
    )

    const customer =
      await billing.getCustomerByStripeCustomerId("cus_from_sub")
    expect(customer).toMatchObject({
      stripeCustomerId: "cus_from_sub",
      accountId: null,
      userId: null,
    })

    const subscription =
      await billing.getSubscriptionByStripeId("sub_unlinked")
    expect(subscription).toMatchObject({
      stripeSubscriptionId: "sub_unlinked",
      stripeCustomerId: "cus_from_sub",
      status: "active",
      accountId: null,
    })
  })

  it("links rows and promotes teams when metadata arrives later", async () => {
    const { account, user } = await createUserAccount()

    await processStripeEvent(
      subscriptionEvent("customer.subscription.created", {
        id: "sub_teams",
        customer: "cus_teams",
        status: "active",
      }),
    )

    await processStripeEvent(
      subscriptionEvent("customer.subscription.updated", {
        id: "sub_teams",
        customer: "cus_teams",
        status: "active",
        metadata: {
          orgId: account.id,
          userId: user.id,
          planType: "teams",
        },
      }),
    )

    const customer = await billing.getCustomerByStripeCustomerId("cus_teams")
    expect(customer).toMatchObject({
      accountId: account.id,
      userId: user.id,
    })

    const subscription = await billing.getSubscriptionByStripeId("sub_teams")
    expect(subscription).toMatchObject({
      accountId: account.id,
      planType: "teams",
      status: "active",
    })

    const byAccount = await billing.getCustomerByAccountId(account.id)
    expect(byAccount?.stripeCustomerId).toBe("cus_teams")

    const scope = await accounts.getAuthScope(user.id)
    expect(scope.ok).toBe(true)
    if (!scope.ok) return
    expect(scope.scope.account.type).toBe("team")
  })

  it("marks a subscription canceled on delete", async () => {
    await processStripeEvent(
      subscriptionEvent("customer.subscription.created", {
        id: "sub_cancel",
        customer: "cus_cancel",
        status: "active",
      }),
    )

    await processStripeEvent(
      subscriptionEvent("customer.subscription.deleted", {
        id: "sub_cancel",
        customer: "cus_cancel",
      }),
    )

    const subscription = await billing.getSubscriptionByStripeId("sub_cancel")
    expect(subscription?.status).toBe("canceled")
  })

  it("updates customer email without clearing missing linkage", async () => {
    const { account, user } = await createUserAccount({
      email: "linked@example.com",
    })

    await processStripeEvent(
      customerEvent("customer.created", {
        id: "cus_link",
        email: "linked@example.com",
        metadata: {
          orgId: account.id,
          userId: user.id,
        },
      }),
    )

    await processStripeEvent(
      customerEvent("customer.updated", {
        id: "cus_link",
        email: "new@example.com",
        metadata: {},
      }),
    )

    const customer = await billing.getCustomerByStripeCustomerId("cus_link")
    expect(customer).toMatchObject({
      email: "new@example.com",
      accountId: account.id,
      userId: user.id,
    })
  })
})
