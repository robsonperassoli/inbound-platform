import { env } from "./env.ts"

export type PricingPlanId = "starter" | "pro" | "team"
export type BillingCycle = "monthly" | "yearly"
export type CheckoutPlanId = "starter" | "pro"

const PRICE_ENV_KEYS = {
  starter: {
    monthly: "STRIPE_STARTER_PRICE_ID",
    yearly: "STRIPE_STARTER_PRICE_YEARLY_ID",
  },
  pro: {
    monthly: "STRIPE_PRO_PRICE_ID",
    yearly: "STRIPE_PRO_PRICE_YEARLY_ID",
  },
} as const

export function getStripePriceId(
  plan: CheckoutPlanId,
  cycle: BillingCycle,
): string {
  const key = PRICE_ENV_KEYS[plan][cycle]
  const priceId = env[key]
  if (!priceId) {
    throw new Error(`Stripe price not configured (${key})`)
  }
  return priceId
}

export function getPlanIdForPriceId(
  priceId: string | null | undefined,
): PricingPlanId | "free" {
  if (!priceId) return "free"

  if (
    priceId === env.STRIPE_STARTER_PRICE_ID ||
    priceId === env.STRIPE_STARTER_PRICE_YEARLY_ID
  ) {
    return "starter"
  }

  if (
    priceId === env.STRIPE_PRO_PRICE_ID ||
    priceId === env.STRIPE_PRO_PRICE_YEARLY_ID
  ) {
    return "pro"
  }

  return "free"
}
