import * as accounts from "../accounts/index"
import * as repository from "./repository"

export async function getCustomerByAccountId(accountId: string) {
  return repository.getCustomerByAccountId(accountId)
}

export async function saveStripeCustomer(input: {
  accountId: string
  userId: string
  stripeCustomerId: string
  email?: string | null
}) {
  return repository.createCustomer(input)
}

export async function getLatestSubscription(accountId: string) {
  return repository.getLatestSubscriptionByAccount(accountId)
}

export async function syncSubscription(input: {
  accountId: string
  stripeCustomerId: string
  stripeSubscriptionId: string
  status: string
  priceId?: string | null
  planType?: string | null
  currentPeriodEnd?: number | null
}) {
  const existing = await repository.getSubscriptionByStripeId(
    input.stripeSubscriptionId,
  )

  const values = {
    accountId: input.accountId,
    stripeCustomerId: input.stripeCustomerId,
    stripeSubscriptionId: input.stripeSubscriptionId,
    status: input.status,
    priceId: input.priceId ?? null,
    planType: input.planType ?? null,
    currentPeriodEnd: input.currentPeriodEnd ?? null,
    updatedAt: Date.now(),
  }

  if (existing) {
    await repository.updateSubscription(existing.id, values)
  } else {
    await repository.createSubscription(values)
  }

  if (input.planType === "teams" && input.status === "active") {
    await accounts.setAccountType(input.accountId, "team")
  }
}

export async function getMeBillingState(accountId: string, accountType: string) {
  const subscription = await repository.getLatestSubscriptionByAccount(accountId)
  const subscribed =
    subscription?.status === "active" ||
    subscription?.status === "trialing" ||
    accountType === "team"

  return { subscription, subscribed }
}
