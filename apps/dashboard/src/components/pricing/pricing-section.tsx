import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { BillingCycle, PriceConfig } from "@/lib/pricing"
import type { PricingPlanConfig } from "@/lib/pricing-plans"
import { cn } from "@/lib/utils"
import { PlanFeatureLabel } from "./plan-feature-label"

export type PricingPlanView = PricingPlanConfig & {
  pricing: PriceConfig
  isActive?: boolean
}

export type PricingPlanCtaState = {
  label: string
  disabled?: boolean
  loading?: boolean
}

type PricingSectionProps = {
  billingCycle: BillingCycle
  onBillingCycleChange: (cycle: BillingCycle) => void
  plans: PricingPlanView[]
  getPlanCta: (plan: PricingPlanView) => PricingPlanCtaState
  onPlanCtaClick: (plan: PricingPlanView) => void
  className?: string
}

export function PricingSection({
  billingCycle,
  onBillingCycleChange,
  plans,
  getPlanCta,
  onPlanCtaClick,
  className,
}: PricingSectionProps) {
  return (
    <section
      className={cn(
        "relative mx-auto w-full max-w-6xl overflow-hidden rounded-3xl p-4 sm:p-6",
        className,
      )}
    >
      <div className="relative space-y-8">
        <header className="space-y-4">
          <p className="text-xs font-semibold tracking-[0.12em] text-primary/80 uppercase">
            Inbound Pricing
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Choose the plan that matches how you capture leads
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Start with Starter or Pro, then move to Team or Agency pricing when
            you need multiple profiles, premium support, and a more custom
            setup.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex rounded-full border border-border/70 bg-background/80 p-1 shadow-sm">
              <button
                type="button"
                className={cn(
                  "w-30 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
                  billingCycle === "yearly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground",
                )}
                onClick={() => onBillingCycleChange("yearly")}
              >
                Yearly
              </button>
              <button
                type="button"
                className={cn(
                  "w-30 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
                  billingCycle === "monthly"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground",
                )}
                onClick={() => onBillingCycleChange("monthly")}
              >
                Monthly
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              Save up to 22% with annual billing.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {plans.map((plan) => {
            const cta = getPlanCta(plan)
            const isPro = plan.id === "pro"

            return (
              <article
                key={plan.id}
                className={cn(
                  "relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-all duration-300",
                  "hover:-translate-y-1 hover:shadow-lg",
                  isPro
                    ? "border-primary/70 bg-card shadow-xl ring-2 ring-primary/25 lg:-translate-y-2 lg:scale-[1.02]"
                    : "border-border/65",
                  plan.isActive && "border-muted-foreground/25",
                )}
              >
                {isPro ? (
                  <>
                    <div className="pointer-events-none absolute inset-x-10 top-0 h-24 rounded-b-full bg-[radial-gradient(circle_at_top,color-mix(in_oklch,var(--color-primary)_20%,transparent)_0%,transparent_70%)] opacity-90" />
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--color-primary)_5%,transparent)_0%,transparent_28%)]" />
                  </>
                ) : null}
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{plan.title}</h2>
                    <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                    {plan.popular ? (
                      <Badge className="mt-3 border border-primary/20 bg-primary text-primary-foreground shadow-sm hover:bg-primary">
                        Most Popular
                      </Badge>
                    ) : null}
                  </div>
                  {plan.pricing.badge ? (
                    <Badge variant="secondary" className="text-xs">
                      {plan.pricing.badge}
                    </Badge>
                  ) : null}
                </div>

                <div className="mb-5 border-b border-border/70 pb-5">
                  {billingCycle === "yearly" &&
                  plan.pricing.originalPriceLabel ? (
                    <p className="text-sm font-medium text-muted-foreground line-through">
                      {plan.pricing.originalPriceLabel}
                    </p>
                  ) : null}
                  <p className="text-4xl font-semibold tracking-tight">
                    {plan.pricing.priceLabel}
                    {plan.pricing.period ? (
                      <span className="ml-1 text-base font-medium text-muted-foreground">
                        {plan.pricing.period}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-2 min-h-5 text-sm text-muted-foreground transition-opacity duration-300">
                    {billingCycle === "yearly" &&
                    plan.pricing.originalPriceLabel
                      ? " "
                      : plan.pricing.equivalent || " "}
                  </p>
                </div>

                <ul className="mb-6 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={
                        typeof feature === "string" ? feature : feature.label
                      }
                      className="flex items-start gap-2 text-sm text-foreground/90"
                    >
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/70" />
                      <span>
                        <PlanFeatureLabel feature={feature} />
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={cn(
                    "mt-auto w-full",
                    isPro &&
                      !cta.disabled &&
                      "bg-primary text-primary-foreground shadow-md hover:bg-primary/90",
                    !isPro &&
                      !cta.disabled &&
                      "bg-background text-foreground ring-1 ring-border hover:bg-muted/60",
                    cta.disabled &&
                      "bg-muted text-muted-foreground hover:bg-muted",
                  )}
                  disabled={cta.disabled || cta.loading}
                  onClick={() => onPlanCtaClick(plan)}
                >
                  {cta.loading ? "Redirecting..." : cta.label}
                </Button>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
