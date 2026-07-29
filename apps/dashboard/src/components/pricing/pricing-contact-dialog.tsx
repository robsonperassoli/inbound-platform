import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export type PricingContactFormValues = {
  email: string
  phone: string
  companyName: string
}

type PricingContactFormErrors = Partial<
  Record<keyof PricingContactFormValues, string>
>

const emptyContactValues: PricingContactFormValues = {
  email: "",
  phone: "",
  companyName: "",
}

type PricingContactDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: PricingContactFormValues) => Promise<void>
  initialValues?: Partial<PricingContactFormValues>
}

export function PricingContactDialog({
  open,
  onOpenChange,
  onSubmit,
  initialValues,
}: PricingContactDialogProps) {
  const [contactValues, setContactValues] =
    useState<PricingContactFormValues>(emptyContactValues)
  const [contactErrors, setContactErrors] =
    useState<PricingContactFormErrors>({})
  const [contactSubmitting, setContactSubmitting] = useState(false)
  const [contactSubmitted, setContactSubmitted] = useState(false)
  const [contactFormError, setContactFormError] = useState("")

  useEffect(() => {
    if (!open) {
      return
    }

    setContactValues({
      email: initialValues?.email ?? "",
      phone: initialValues?.phone ?? "",
      companyName: initialValues?.companyName ?? "",
    })
    setContactErrors({})
    setContactFormError("")
    setContactSubmitted(false)
  }, [initialValues, open])

  const closeContactModal = (nextOpen: boolean) => {
    if (nextOpen) {
      return
    }

    onOpenChange(false)
    setContactErrors({})
    setContactFormError("")
    setContactSubmitted(false)
  }

  const validateContactForm = () => {
    const errors: PricingContactFormErrors = {}

    if (!contactValues.email.trim()) {
      errors.email = "Email is required"
    }

    if (!contactValues.phone.trim()) {
      errors.phone = "Phone is required"
    }

    if (!contactValues.companyName.trim()) {
      errors.companyName = "Company name is required"
    }

    setContactErrors(errors)
    return Object.keys(errors).length === 0
  }

  return (
    <Dialog open={open} onOpenChange={closeContactModal}>
      <DialogContent>
        {contactSubmitted ? (
          <>
            <DialogHeader className="items-center text-center">
              <div className="relative mx-auto flex size-16 items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-primary/12 blur-md" />
                <div className="relative flex size-14 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary shadow-sm">
                  <HugeiconsIcon
                    icon={CheckmarkCircle02Icon}
                    strokeWidth={2}
                    className="size-7"
                  />
                </div>
              </div>
              <DialogTitle className="text-xl font-semibold tracking-tight">
                You&apos;re all set, we&apos;ll be in touch soon
              </DialogTitle>
              <DialogDescription>
                Our team will review your details and reach out personally to
                talk through your needs and recommend the best setup.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center" showCloseButton />
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Connect with us</DialogTitle>
              <DialogDescription>
                Please fill in your contact information and we&apos;ll reach out
                personally to understand your needs and recommend the best setup
                for your team.
              </DialogDescription>
            </DialogHeader>

            <form
              className="space-y-6"
              onSubmit={async (event) => {
                event.preventDefault()

                if (!validateContactForm()) {
                  return
                }

                try {
                  setContactSubmitting(true)
                  setContactFormError("")

                  await onSubmit({
                    email: contactValues.email.trim(),
                    phone: contactValues.phone.trim(),
                    companyName: contactValues.companyName.trim(),
                  })

                  setContactSubmitted(true)
                } catch (error) {
                  console.error("Failed to submit pricing inquiry", error)
                  setContactFormError(
                    "We couldn't send your request right now. Please try again.",
                  )
                } finally {
                  setContactSubmitting(false)
                }
              }}
            >
              <FieldGroup>
                <Field data-invalid={Boolean(contactErrors.email)}>
                  <FieldLabel>Email</FieldLabel>
                  <Input
                    autoComplete="email"
                    value={contactValues.email}
                    onChange={(event) => {
                      setContactValues((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                      setContactErrors((current) => ({
                        ...current,
                        email: undefined,
                      }))
                    }}
                  />
                  {contactErrors.email ? (
                    <FieldError>{contactErrors.email}</FieldError>
                  ) : null}
                </Field>

                <Field data-invalid={Boolean(contactErrors.phone)}>
                  <FieldLabel>Phone</FieldLabel>
                  <Input
                    autoComplete="tel"
                    value={contactValues.phone}
                    onChange={(event) => {
                      setContactValues((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                      setContactErrors((current) => ({
                        ...current,
                        phone: undefined,
                      }))
                    }}
                  />
                  {contactErrors.phone ? (
                    <FieldError>{contactErrors.phone}</FieldError>
                  ) : null}
                </Field>

                <Field data-invalid={Boolean(contactErrors.companyName)}>
                  <FieldLabel>Company name</FieldLabel>
                  <Input
                    autoComplete="organization"
                    value={contactValues.companyName}
                    onChange={(event) => {
                      setContactValues((current) => ({
                        ...current,
                        companyName: event.target.value,
                      }))
                      setContactErrors((current) => ({
                        ...current,
                        companyName: undefined,
                      }))
                    }}
                  />
                  {contactErrors.companyName ? (
                    <FieldError>{contactErrors.companyName}</FieldError>
                  ) : null}
                </Field>
              </FieldGroup>

              {contactFormError ? (
                <FieldError>{contactFormError}</FieldError>
              ) : null}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => closeContactModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={contactSubmitting}>
                  {contactSubmitting ? "Sending..." : "Send request"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
