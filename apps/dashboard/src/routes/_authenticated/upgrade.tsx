import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { ScrollableContainer } from "@/components/app-layout/scrollable-container"
import {
  PricingContactDialog,
  type PricingContactFormValues,
} from "@/components/pricing/pricing-contact-dialog"
import {
  PricingSection,
  type PricingPlanView,
} from "@/components/pricing/pricing-section"
import { useSelectedProfile } from "@/hooks/use-selected-profile"
import { useSession } from "@/hooks/use-session"
import {
  useCreateCheckout,
  useSubmitSalesLead,
} from "@/hooks/queries/billing"
import { type BillingCycle, type PricingPlanId } from "@/lib/pricing"
import { PRICING_PLANS } from "@/lib/pricing-plans"

export const Route = createFileRoute("/_authenticated/upgrade")({
  component: RouteComponent,
})

function RouteComponent() {
  const session = useSession()
  const profileData = useSelectedProfile()
  const createCheckout = useCreateCheckout()
  const submitSalesLead = useSubmitSalesLead()

  const activePlan = session?.plan ?? "free"

  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly")
  const [checkoutPlan, setCheckoutPlan] = useState<PricingPlanId | null>(null)
  const [contactPlan, setContactPlan] = useState<PricingPlanId | null>(null)
  const [contactInitialValues, setContactInitialValues] = useState<
    Partial<PricingContactFormValues>
  >({})

  useEffect(() => {
    setContactInitialValues({
      email: session?.email ?? "",
      phone: session?.phoneNumber ?? "",
      companyName: "",
    })
  }, [session])

  const plans = useMemo(
    (): PricingPlanView[] =>
      PRICING_PLANS.map((plan) => ({
        ...plan,
        pricing: billingCycle === "monthly" ? plan.monthly : plan.yearly,
        isActive: plan.id === activePlan,
      })),
    [activePlan, billingCycle],
  )

  const openContactModal = (planId: PricingPlanId) => {
    setContactPlan(planId)
  }

  const handleSubmitContact = async (values: PricingContactFormValues) => {
    if (!profileData?.profile.id) {
      throw new Error("Profile not selected")
    }

    await submitSalesLead.mutateAsync({
      ...values,
      profileId: profileData.profile.id,
      userAgent: window.navigator.userAgent,
    })
  }

  return (
    <>
      <ScrollableContainer className="relative min-h-[calc(100vh-4rem)] bg-muted/25">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_color-mix(in_oklch,var(--color-primary)_10%,transparent)_0%,transparent_65%)]" />
        <PricingSection
          billingCycle={billingCycle}
          onBillingCycleChange={setBillingCycle}
          plans={plans}
          getPlanCta={(plan) => ({
            label: plan.isActive ? "Current Plan" : plan.cta,
            disabled: plan.isActive,
            loading: checkoutPlan === plan.id,
          })}
          onPlanCtaClick={async (plan) => {
            if (plan.isActive) {
              return
            }

            if (plan.id === "team") {
              openContactModal(plan.id)
              return
            }

            try {
              setCheckoutPlan(plan.id)
              const result = await createCheckout.mutateAsync({
                plan: plan.id,
                cycle: billingCycle,
              })
              if (!result.url) {
                throw new Error("Missing checkout URL")
              }
              window.location.href = result.url
            } catch (error) {
              console.error("Failed to create checkout session", error)
              toast.error(
                error instanceof Error
                  ? error.message
                  : "Failed to start checkout",
              )
            } finally {
              setCheckoutPlan(null)
            }
          }}
        />
      </ScrollableContainer>

      <PricingContactDialog
        open={contactPlan !== null}
        onOpenChange={(open) => {
          if (!open) {
            setContactPlan(null)
          }
        }}
        onSubmit={handleSubmitContact}
        initialValues={contactInitialValues}
      />
    </>
  )
}
