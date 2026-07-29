import { desc, eq } from "drizzle-orm"
import { createId } from "@inbound/shared"
import { db } from "../../db/client"
import { stripeCustomers, stripeSubscriptions } from "../../db/schema"

export async function getCustomerByAccountId(accountId: string) {
  return db.query.stripeCustomers.findFirst({
    where: eq(stripeCustomers.accountId, accountId),
  })
}

export async function createCustomer(input: {
  id?: string
  accountId: string
  userId: string
  stripeCustomerId: string
  email?: string | null
}) {
  const id = input.id ?? createId()
  const [row] = await db
    .insert(stripeCustomers)
    .values({
      id,
      accountId: input.accountId,
      userId: input.userId,
      stripeCustomerId: input.stripeCustomerId,
      email: input.email ?? null,
    })
    .returning()
  return row!
}

export async function getSubscriptionByStripeId(stripeSubscriptionId: string) {
  return db.query.stripeSubscriptions.findFirst({
    where: eq(stripeSubscriptions.stripeSubscriptionId, stripeSubscriptionId),
  })
}

export async function getLatestSubscriptionByAccount(accountId: string) {
  return db.query.stripeSubscriptions.findFirst({
    where: eq(stripeSubscriptions.accountId, accountId),
    orderBy: [desc(stripeSubscriptions.updatedAt)],
  })
}

export async function createSubscription(input: {
  id?: string
  accountId: string
  stripeCustomerId: string
  stripeSubscriptionId: string
  status: string
  priceId?: string | null
  planType?: string | null
  currentPeriodEnd?: number | null
  updatedAt?: number
}) {
  const id = input.id ?? createId()
  await db.insert(stripeSubscriptions).values({
    id,
    accountId: input.accountId,
    stripeCustomerId: input.stripeCustomerId,
    stripeSubscriptionId: input.stripeSubscriptionId,
    status: input.status,
    priceId: input.priceId ?? null,
    planType: input.planType ?? null,
    currentPeriodEnd: input.currentPeriodEnd ?? null,
    updatedAt: input.updatedAt ?? Date.now(),
  })
  return getSubscriptionByStripeId(input.stripeSubscriptionId)
}

export async function updateSubscription(
  id: string,
  patch: {
    accountId?: string
    stripeCustomerId?: string
    stripeSubscriptionId?: string
    status?: string
    priceId?: string | null
    planType?: string | null
    currentPeriodEnd?: number | null
    updatedAt?: number
  },
) {
  await db
    .update(stripeSubscriptions)
    .set({ ...patch, updatedAt: patch.updatedAt ?? Date.now() })
    .where(eq(stripeSubscriptions.id, id))
  return db.query.stripeSubscriptions.findFirst({
    where: eq(stripeSubscriptions.id, id),
  })
}
