import * as accounts from "../accounts/index"
import * as repository from "./repository"

export async function getCustomerByAccountId(accountId: string) {
  return repository.getCustomerByAccountId(accountId)
}

export async function getCustomerByStripeCustomerId(stripeCustomerId: string) {
  return repository.getCustomerByStripeCustomerId(stripeCustomerId)
}

export async function saveStripeCustomer(input: {
  accountId: string
  userId: string
  stripeCustomerId: string
  email?: string | null
}) {
  return upsertStripeCustomer(input)
}

export async function upsertStripeCustomer(input: {
  stripeCustomerId: string
  email?: string | null
  accountId?: string | null
  userId?: string | null
}) {
  const existing = await repository.getCustomerByStripeCustomerId(
    input.stripeCustomerId,
  )

  if (existing) {
    const patch: {
      email?: string | null
      accountId?: string | null
      userId?: string | null
    } = {}

    if (input.email !== undefined) patch.email = input.email
    if (input.accountId) patch.accountId = input.accountId
    if (input.userId) patch.userId = input.userId

    return (await repository.updateCustomer(existing.id, patch)) ?? existing
  }

  return repository.createCustomer({
    stripeCustomerId: input.stripeCustomerId,
    email: input.email ?? null,
    accountId: input.accountId ?? null,
    userId: input.userId ?? null,
  })
}

export async function getLatestSubscription(accountId: string) {
  return repository.getLatestSubscriptionByAccount(accountId)
}

export async function getSubscriptionByStripeId(stripeSubscriptionId: string) {
  return repository.getSubscriptionByStripeId(stripeSubscriptionId)
}

export async function syncSubscription(input: {
  accountId?: string | null
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

  const values: {
    stripeCustomerId: string
    stripeSubscriptionId: string
    status: string
    priceId: string | null
    planType: string | null
    currentPeriodEnd: number | null
    updatedAt: number
    accountId?: string | null
  } = {
    stripeCustomerId: input.stripeCustomerId,
    stripeSubscriptionId: input.stripeSubscriptionId,
    status: input.status,
    priceId: input.priceId ?? null,
    planType: input.planType ?? null,
    currentPeriodEnd: input.currentPeriodEnd ?? null,
    updatedAt: Date.now(),
  }

  // Only attach / overwrite account linkage when metadata provides it.
  if (input.accountId) {
    values.accountId = input.accountId
  }

  if (existing) {
    await repository.updateSubscription(existing.id, values)
  } else {
    await repository.createSubscription({
      ...values,
      accountId: input.accountId ?? null,
    })
  }

  const accountId = input.accountId ?? existing?.accountId
  if (
    accountId &&
    input.planType === "teams" &&
    input.status === "active"
  ) {
    await accounts.setAccountType(accountId, "team")
  }
}

export async function markSubscriptionCanceled(stripeSubscriptionId: string) {
  const existing =
    await repository.getSubscriptionByStripeId(stripeSubscriptionId)
  if (!existing) return null

  return repository.updateSubscription(existing.id, {
    status: "canceled",
  })
}

export async function getMeBillingState(accountId: string, accountType: string) {
  const subscription = await repository.getLatestSubscriptionByAccount(accountId)
  const subscribed =
    subscription?.status === "active" ||
    subscription?.status === "trialing" ||
    accountType === "team"

  return { subscription, subscribed }
}
