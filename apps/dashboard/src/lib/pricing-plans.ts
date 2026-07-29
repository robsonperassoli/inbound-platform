import { PRICING, type PricingPlanId } from "@/lib/pricing"

export type PlanFeature =
  | string
  | {
      label: string
      tooltip: string
    }

export type PricingPlanConfig = {
  id: PricingPlanId
  title: string
  description: string
  cta: string
  popular?: boolean
  features: PlanFeature[]
  monthly: (typeof PRICING)[PricingPlanId]["monthly"]
  yearly: (typeof PRICING)[PricingPlanId]["yearly"]
}

export const PRICING_PLANS: PricingPlanConfig[] = [
  {
    id: "starter",
    title: "Starter",
    description: "For solo creators getting their first qualified leads.",
    cta: "Choose Starter",
    features: [
      "Collect leads",
      "Inbound.click branding",
      "Basic lead capture (name, email, phone)",
      "4 themes",
      "Auto-generated link",
    ],
    monthly: PRICING.starter.monthly,
    yearly: PRICING.starter.yearly,
  },
  {
    id: "pro",
    title: "Pro",
    description:
      "For operators who need better conversion workflows and control.",
    cta: "Choose Pro",
    popular: true,
    features: [
      {
        label: "Instant notifications",
        tooltip:
          "Get notified as soon as someone starts or finishes a chat, and review the full conversation transcript anytime.",
      },
      "Analytics",
      "Export leads",
      "Premium themes",
      "Advanced lead capture flows",
      "Full color customization",
      "No Inbound branding",
      "Integrations",
      {
        label: "Custom link",
        tooltip:
          "Choose your own page username, like s.uper.bio/yourname, as long as it is available.",
      },
    ],
    monthly: PRICING.pro.monthly,
    yearly: PRICING.pro.yearly,
  },
  {
    id: "team",
    title: "Team",
    description:
      "Custom pricing for teams and agencies that need a shared setup.",
    cta: "Connect with us",
    features: [
      "Everything in Pro plan",
      "Priority support",
      "Better AI models",
      "Multiple profiles",
    ],
    monthly: PRICING.team.monthly,
    yearly: PRICING.team.yearly,
  },
]
