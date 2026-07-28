export type PricingPlanId = "starter" | "pro" | "team"
export type BillingCycle = "monthly" | "yearly"

export type PriceConfig = {
  priceLabel: string
  period: string
  equivalent?: string
  badge?: string
  originalPriceLabel?: string
}

export const PRICING: Record<
  PricingPlanId,
  Record<BillingCycle, PriceConfig>
> = {
  starter: {
    monthly: {
      priceLabel: "$9",
      period: "/mo",
    },
    yearly: {
      priceLabel: "$99",
      period: "/yr",
      originalPriceLabel: "$108",
    },
  },
  pro: {
    monthly: {
      priceLabel: "$19",
      period: "/mo",
    },
    yearly: {
      priceLabel: "$178",
      period: "/yr",
      originalPriceLabel: "$228",
    },
  },
  team: {
    monthly: {
      priceLabel: "Custom",
      period: "",
      equivalent: "For teams and agencies",
      badge: "Custom Pricing",
    },
    yearly: {
      priceLabel: "Custom",
      period: "",
      equivalent: "For teams and agencies",
      badge: "Custom Pricing",
    },
  },
}
