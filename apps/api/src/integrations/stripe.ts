import Stripe from "stripe"
import { eq } from "drizzle-orm"
import { db } from "../db/client.ts"
import { accounts, stripeCustomers, stripeSubscriptions } from "../db/schema.ts"
import { env } from "../lib/env.ts"
import { createId } from "@inbound/shared"

export function getStripe() {
  if (!env.STRIPE_SECRET_KEY) return null
  return new Stripe(env.STRIPE_SECRET_KEY)
}

export async function getOrCreateStripeCustomer(input: {
  accountId: string
  userId: string
  email?: string | null
  name?: string | null
}) {
  const stripe = getStripe()
  if (!stripe) throw new Error("Stripe is not configured")

  const existing = await db.query.stripeCustomers.findFirst({
    where: eq(stripeCustomers.accountId, input.accountId),
  })
  if (existing) return existing

  const customer = await stripe.customers.create({
    email: input.email ?? undefined,
    name: input.name ?? undefined,
    metadata: {
      accountId: input.accountId,
      userId: input.userId,
      orgId: input.accountId,
    },
  })

  const [row] = await db
    .insert(stripeCustomers)
    .values({
      id: createId(),
      accountId: input.accountId,
      userId: input.userId,
      stripeCustomerId: customer.id,
      email: input.email ?? null,
    })
    .returning()

  return row!
}

export async function createCheckoutSession(input: {
  accountId: string
  userId: string
  email?: string | null
  name?: string | null
  priceId: string
  planType?: string
}) {
  const stripe = getStripe()
  if (!stripe) throw new Error("Stripe is not configured")

  const customer = await getOrCreateStripeCustomer(input)

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customer.stripeCustomerId,
    line_items: [{ price: input.priceId, quantity: 1 }],
    success_url: `${env.DASHBOARD_URL}/bio?success=true`,
    cancel_url: `${env.DASHBOARD_URL}/upgrade?canceled=true`,
    subscription_data: {
      metadata: {
        userId: input.userId,
        orgId: input.accountId,
        accountId: input.accountId,
        planType: input.planType ?? "",
      },
    },
  })

  return { sessionId: session.id, url: session.url }
}

export async function createCustomerPortalSession(accountId: string) {
  const stripe = getStripe()
  if (!stripe) throw new Error("Stripe is not configured")

  const customer = await db.query.stripeCustomers.findFirst({
    where: eq(stripeCustomers.accountId, accountId),
  })
  if (!customer) return null

  const session = await stripe.billingPortal.sessions.create({
    customer: customer.stripeCustomerId,
    return_url: `${env.DASHBOARD_URL}/bio`,
  })

  return { url: session.url }
}

export async function handleStripeWebhook(rawBody: string, signature: string) {
  const stripe = getStripe()
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("Stripe webhook is not configured")
  }

  const event = stripe.webhooks.constructEvent(
    rawBody,
    signature,
    env.STRIPE_WEBHOOK_SECRET,
  )

  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated"
  ) {
    const subscription = event.data.object
    const accountId =
      subscription.metadata.orgId ?? subscription.metadata.accountId
    if (!accountId) return { received: true }

    const existing = await db.query.stripeSubscriptions.findFirst({
      where: eq(stripeSubscriptions.stripeSubscriptionId, subscription.id),
    })

    const values = {
      accountId,
      stripeCustomerId:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id,
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      priceId: subscription.items.data[0]?.price.id ?? null,
      planType: subscription.metadata.planType ?? null,
      currentPeriodEnd: subscription.current_period_end
        ? subscription.current_period_end * 1000
        : null,
      updatedAt: Date.now(),
    }

    if (existing) {
      await db
        .update(stripeSubscriptions)
        .set(values)
        .where(eq(stripeSubscriptions.id, existing.id))
    } else {
      await db.insert(stripeSubscriptions).values({
        id: createId(),
        ...values,
      })
    }

    if (
      subscription.metadata.planType === "teams" &&
      subscription.status === "active"
    ) {
      await db
        .update(accounts)
        .set({ type: "team" })
        .where(eq(accounts.id, accountId))
    }
  }

  return { received: true }
}
