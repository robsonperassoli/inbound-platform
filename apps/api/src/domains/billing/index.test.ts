import { describe, expect, it } from "vitest"
import * as accounts from "../accounts/index"
import * as billing from "./index"
import * as billingRepo from "./repository"
import { createUserAccount } from "../../test/factories"

describe("billing domain", () => {
  describe("syncSubscription", () => {
    it("creates a subscription and promotes the account to team", async () => {
      const { account, user } = await createUserAccount()

      await billing.syncSubscription({
        accountId: account.id,
        stripeCustomerId: "cus_1",
        stripeSubscriptionId: "sub_1",
        status: "active",
        priceId: "price_teams",
        planType: "teams",
        currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
      })

      const subscription = await billing.getLatestSubscription(account.id)
      expect(subscription).toMatchObject({
        accountId: account.id,
        stripeCustomerId: "cus_1",
        stripeSubscriptionId: "sub_1",
        status: "active",
        planType: "teams",
      })

      const scope = await accounts.getAuthScope(user.id)
      expect(scope.ok).toBe(true)
      if (!scope.ok) return
      expect(scope.scope.account.type).toBe("team")
    })

    it("updates an existing subscription by stripe id", async () => {
      const { account } = await createUserAccount()

      await billing.syncSubscription({
        accountId: account.id,
        stripeCustomerId: "cus_1",
        stripeSubscriptionId: "sub_1",
        status: "trialing",
        planType: "starter",
      })

      await billing.syncSubscription({
        accountId: account.id,
        stripeCustomerId: "cus_1",
        stripeSubscriptionId: "sub_1",
        status: "active",
        planType: "pro",
      })

      const subscription = await billingRepo.getSubscriptionByStripeId("sub_1")
      expect(subscription).toMatchObject({
        status: "active",
        planType: "pro",
      })

      const latest = await billing.getLatestSubscription(account.id)
      expect(latest?.id).toBe(subscription?.id)
    })

    it("does not promote the account when the plan is not an active teams plan", async () => {
      const { account, user } = await createUserAccount()

      await billing.syncSubscription({
        accountId: account.id,
        stripeCustomerId: "cus_1",
        stripeSubscriptionId: "sub_1",
        status: "active",
        planType: "starter",
      })

      const scope = await accounts.getAuthScope(user.id)
      expect(scope.ok).toBe(true)
      if (!scope.ok) return
      expect(scope.scope.account.type).toBe("individual")
    })
  })

  describe("getMeBillingState", () => {
    it("marks the account subscribed when subscription is active", async () => {
      const { account } = await createUserAccount()

      await billing.syncSubscription({
        accountId: account.id,
        stripeCustomerId: "cus_1",
        stripeSubscriptionId: "sub_1",
        status: "active",
        planType: "starter",
      })

      const state = await billing.getMeBillingState(account.id, "individual")
      expect(state.subscribed).toBe(true)
      expect(state.subscription?.stripeSubscriptionId).toBe("sub_1")
    })

    it("marks the account subscribed when subscription is trialing", async () => {
      const { account } = await createUserAccount()

      await billing.syncSubscription({
        accountId: account.id,
        stripeCustomerId: "cus_1",
        stripeSubscriptionId: "sub_1",
        status: "trialing",
        planType: "starter",
      })

      const state = await billing.getMeBillingState(account.id, "individual")
      expect(state.subscribed).toBe(true)
    })

    it("marks team accounts subscribed even without an active subscription", async () => {
      const { account } = await createUserAccount({ accountType: "team" })

      const state = await billing.getMeBillingState(account.id, "team")
      expect(state.subscribed).toBe(true)
      expect(state.subscription).toBeUndefined()
    })

    it("marks individual accounts without subscriptions as not subscribed", async () => {
      const { account } = await createUserAccount()

      const state = await billing.getMeBillingState(account.id, "individual")
      expect(state.subscribed).toBe(false)
      expect(state.subscription).toBeUndefined()
    })
  })

  describe("customers", () => {
    it("saves and loads a stripe customer by account", async () => {
      const { account, user } = await createUserAccount({
        email: "billing@example.com",
      })

      await billing.saveStripeCustomer({
        accountId: account.id,
        userId: user.id,
        stripeCustomerId: "cus_saved",
        email: "billing@example.com",
      })

      const customer = await billing.getCustomerByAccountId(account.id)
      expect(customer).toMatchObject({
        accountId: account.id,
        userId: user.id,
        stripeCustomerId: "cus_saved",
        email: "billing@example.com",
      })
    })
  })
})
