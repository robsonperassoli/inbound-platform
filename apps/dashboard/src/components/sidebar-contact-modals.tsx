"use client"

import { useLocation } from "@tanstack/react-router"
import { type FormEvent, useEffect, useState } from "react"
import type z from "zod"
import {
  type BugFeedbackValues,
  bugAreaOptions,
  bugFeedbackSchema,
  type FeatureFeedbackValues,
  type FeedbackType,
  featureAreaOptions,
  featureFeedbackSchema,
  getFieldErrors,
  type SupportFormValues,
  supportCategoryOptions,
  supportSchema,
} from "@/components/contact-schemas"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useSelectedProfile } from "@/hooks/use-selected-profile"
import { useSession } from "@/hooks/use-session"
import { apiClient } from "@/lib/api"

type ModalType = "support" | "feedback" | null
type Errors<T> = Partial<Record<keyof T, string>>

const emptySupportValues = (email = ""): SupportFormValues => ({
  email,
  subject: "",
  category: "bio",
  message: "",
  routeContext: "",
})

const emptyFeatureValues = (email = ""): FeatureFeedbackValues => ({
  email,
  title: "",
  area: "bio",
  summary: "",
  requestedChange: "",
  impact: "",
})

const emptyBugValues = (email = ""): BugFeedbackValues => ({
  email,
  title: "",
  area: "bio",
  summary: "",
  expectedBehavior: "",
  reproSteps: "",
})

function firstError<T extends Record<string, unknown>>(
  errors: Partial<Record<keyof T, string[]>>,
) {
  return Object.fromEntries(
    Object.entries(errors).map(([key, value]) => [key, value?.[0] ?? ""]),
  ) as Errors<T>
}

function validateForm<T extends Record<string, unknown>>(
  schema: z.ZodSchema<T>,
  values: T,
) {
  const result = schema.safeParse(values)
  if (result.success) {
    return {
      success: true as const,
      data: result.data,
      errors: {} as Errors<T>,
    }
  }

  return {
    success: false as const,
    errors: firstError(getFieldErrors(result.error)),
  }
}

function RequiredLabel({ children }: { children: string }) {
  return (
    <FieldLabel>
      {children} <span className="text-destructive">*</span>
    </FieldLabel>
  )
}

function SuccessState({
  title,
  description,
  onClose,
}: {
  title: string
  description: string
  onClose: () => void
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button onClick={onClose}>Close</Button>
      </DialogFooter>
    </>
  )
}

export function SidebarContactModals({
  openModal,
  onOpenChange,
}: {
  openModal: ModalType
  onOpenChange: (next: ModalType) => void
}) {
  const support = openModal === "support"
  const feedback = openModal === "feedback"
  const { pathname } = useLocation()
  const session = useSession()
  const profileData = useSelectedProfile()

  const defaultEmail = session?.email ?? ""
  const requesterName = session?.name ?? profileData?.profile.title ?? "there"

  const [supportValues, setSupportValues] = useState<SupportFormValues>(
    emptySupportValues(defaultEmail),
  )
  const [supportErrors, setSupportErrors] = useState<Errors<SupportFormValues>>(
    {},
  )
  const [supportSubmitted, setSupportSubmitted] = useState(false)
  const [supportSending, setSupportSending] = useState(false)
  const [supportSuccessEmail, setSupportSuccessEmail] = useState<string | null>(
    null,
  )
  const [supportFormError, setSupportFormError] = useState("")

  const [feedbackType, setFeedbackType] = useState<FeedbackType>("feature")
  const [featureValues, setFeatureValues] = useState<FeatureFeedbackValues>(
    emptyFeatureValues(defaultEmail),
  )
  const [featureErrors, setFeatureErrors] = useState<
    Errors<FeatureFeedbackValues>
  >({})
  const [bugValues, setBugValues] = useState<BugFeedbackValues>(
    emptyBugValues(defaultEmail),
  )
  const [bugErrors, setBugErrors] = useState<Errors<BugFeedbackValues>>({})
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [feedbackSending, setFeedbackSending] = useState(false)
  const [feedbackSuccessEmail, setFeedbackSuccessEmail] = useState<
    string | null
  >(null)
  const [feedbackFormError, setFeedbackFormError] = useState("")

  useEffect(() => {
    if (!defaultEmail) return

    setSupportValues((current) =>
      current.email ? current : { ...current, email: defaultEmail },
    )
    setFeatureValues((current) =>
      current.email ? current : { ...current, email: defaultEmail },
    )
    setBugValues((current) =>
      current.email ? current : { ...current, email: defaultEmail },
    )
  }, [defaultEmail])

  const resetSupportState = () => {
    setSupportValues(emptySupportValues(defaultEmail))
    setSupportErrors({})
    setSupportSubmitted(false)
    setSupportSending(false)
    setSupportSuccessEmail(null)
    setSupportFormError("")
  }

  const resetFeedbackState = () => {
    setFeedbackType("feature")
    setFeatureValues(emptyFeatureValues(defaultEmail))
    setFeatureErrors({})
    setBugValues(emptyBugValues(defaultEmail))
    setBugErrors({})
    setFeedbackSubmitted(false)
    setFeedbackSending(false)
    setFeedbackSuccessEmail(null)
    setFeedbackFormError("")
  }

  const closeSupport = () => {
    onOpenChange(null)
    resetSupportState()
  }

  const closeFeedback = () => {
    onOpenChange(null)
    resetFeedbackState()
  }

  const handleSupportSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSupportSubmitted(true)
    setSupportFormError("")

    const validation = validateForm(supportSchema, supportValues)
    if (!validation.success) {
      setSupportErrors(validation.errors)
      return
    }

    setSupportSending(true)

    try {
      if (!profileData?.profile.id) {
        throw new Error("Profile not selected")
      }

      await apiClient.sendSupport(
        [
          `Category: ${validation.data.category}`,
          `Email: ${validation.data.email}`,
          `Route: ${validation.data.routeContext?.trim() || pathname}`,
          "",
          validation.data.message,
        ].join("\n"),
      )
      setSupportSuccessEmail(validation.data.email)
    } catch {
      setSupportFormError("We could not send your request. Please try again.")
    } finally {
      setSupportSending(false)
    }
  }

  const handleFeedbackSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFeedbackSubmitted(true)
    setFeedbackFormError("")

    if (feedbackType === "feature") {
      const validation = validateForm(featureFeedbackSchema, featureValues)
      if (!validation.success) {
        setFeatureErrors(validation.errors)
        return
      }

      setFeedbackSending(true)

      try {
        if (!profileData?.profile.id) {
          throw new Error("Profile not selected")
        }

        await apiClient.sendFeedback(
          [
            `Type: feature`,
            `Email: ${validation.data.email}`,
            `Area: ${validation.data.area}`,
            `Impact: ${validation.data.impact?.trim() || "n/a"}`,
            "",
            validation.data.message,
          ].join("\n"),
        )
        setFeedbackSuccessEmail(validation.data.email)
      } catch {
        setFeedbackFormError(
          "We could not send your feedback. Please try again.",
        )
      } finally {
        setFeedbackSending(false)
      }

      return
    }

    const validation = validateForm(bugFeedbackSchema, bugValues)
    if (!validation.success) {
      setBugErrors(validation.errors)
      return
    }

    setFeedbackSending(true)

    try {
      if (!profileData?.profile.id) {
        throw new Error("Profile not selected")
      }

      await apiClient.sendFeedback(
        [
          `Type: bug`,
          `Email: ${validation.data.email}`,
          `Area: ${validation.data.area}`,
          `Repro: ${validation.data.reproSteps?.trim() || "n/a"}`,
          "",
          validation.data.message,
        ].join("\n"),
      )
      setFeedbackSuccessEmail(validation.data.email)
    } catch {
      setFeedbackFormError("We could not send your feedback. Please try again.")
    } finally {
      setFeedbackSending(false)
    }
  }

  const supportTitle = supportSuccessEmail ? "Request sent" : "Contact support"
  const supportDescription = supportSuccessEmail
    ? `We've emailed your support request to the team. We'll reply to ${supportSuccessEmail}.`
    : "Tell us what's going on and we'll reply by email."

  const feedbackDescription = feedbackSuccessEmail
    ? `Thanks. We've sent this to the team and will reply to ${feedbackSuccessEmail} if we need more detail.`
    : `Hi ${requesterName}, report a bug or suggest a product improvement.`

  return (
    <>
      <Dialog
        open={support}
        onOpenChange={(next) =>
          next ? onOpenChange("support") : closeSupport()
        }
      >
        <DialogContent className="sm:max-w-xl">
          {supportSuccessEmail ? (
            <SuccessState
              title={supportTitle}
              description={supportDescription}
              onClose={closeSupport}
            />
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{supportTitle}</DialogTitle>
                <DialogDescription>{supportDescription}</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSupportSubmit}>
                <FieldGroup>
                  <Field
                    data-invalid={Boolean(
                      supportSubmitted && supportErrors.email,
                    )}
                  >
                    <RequiredLabel>Email</RequiredLabel>
                    <Input
                      type="email"
                      value={supportValues.email}
                      onChange={(event) =>
                        setSupportValues((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      aria-invalid={Boolean(
                        supportSubmitted && supportErrors.email,
                      )}
                    />
                    {supportSubmitted && supportErrors.email ? (
                      <FieldError>{supportErrors.email}</FieldError>
                    ) : null}
                  </Field>

                  <Field
                    data-invalid={Boolean(
                      supportSubmitted && supportErrors.subject,
                    )}
                  >
                    <RequiredLabel>Subject</RequiredLabel>
                    <Input
                      value={supportValues.subject}
                      onChange={(event) =>
                        setSupportValues((current) => ({
                          ...current,
                          subject: event.target.value,
                        }))
                      }
                      placeholder="Short summary of the issue"
                      aria-invalid={Boolean(
                        supportSubmitted && supportErrors.subject,
                      )}
                    />
                    {supportSubmitted && supportErrors.subject ? (
                      <FieldError>{supportErrors.subject}</FieldError>
                    ) : null}
                  </Field>

                  <Field
                    data-invalid={Boolean(
                      supportSubmitted && supportErrors.category,
                    )}
                  >
                    <RequiredLabel>What do you need help with?</RequiredLabel>
                    <Select
                      value={supportValues.category}
                      onValueChange={(value) =>
                        setSupportValues((current) => ({
                          ...current,
                          category: value as SupportFormValues["category"],
                        }))
                      }
                    >
                      <SelectTrigger
                        className="w-full"
                        aria-invalid={Boolean(
                          supportSubmitted && supportErrors.category,
                        )}
                      >
                        <SelectValue placeholder="Choose a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {supportCategoryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {supportSubmitted && supportErrors.category ? (
                      <FieldError>{supportErrors.category}</FieldError>
                    ) : null}
                  </Field>

                  <Field
                    data-invalid={Boolean(
                      supportSubmitted && supportErrors.message,
                    )}
                  >
                    <RequiredLabel>Message</RequiredLabel>
                    <Textarea
                      rows={6}
                      value={supportValues.message}
                      onChange={(event) =>
                        setSupportValues((current) => ({
                          ...current,
                          message: event.target.value,
                        }))
                      }
                      placeholder="Describe the problem, what you expected, and what happened instead."
                      aria-invalid={Boolean(
                        supportSubmitted && supportErrors.message,
                      )}
                    />
                    {supportSubmitted && supportErrors.message ? (
                      <FieldError>{supportErrors.message}</FieldError>
                    ) : null}
                  </Field>

                  <Field>
                    <FieldLabel>Where were you when this happened?</FieldLabel>
                    <Input
                      value={supportValues.routeContext ?? ""}
                      onChange={(event) =>
                        setSupportValues((current) => ({
                          ...current,
                          routeContext: event.target.value,
                        }))
                      }
                      placeholder="/bio/settings, forms page, etc."
                    />
                  </Field>

                  {supportFormError ? (
                    <FieldError>{supportFormError}</FieldError>
                  ) : null}

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={closeSupport}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={supportSending}>
                      {supportSending ? "Sending..." : "Send support request"}
                    </Button>
                  </DialogFooter>
                </FieldGroup>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={feedback}
        onOpenChange={(next) =>
          next ? onOpenChange("feedback") : closeFeedback()
        }
      >
        <DialogContent className="sm:max-w-xl">
          {feedbackSuccessEmail ? (
            <SuccessState
              title="Feedback sent"
              description={feedbackDescription}
              onClose={closeFeedback}
            />
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Share feedback</DialogTitle>
                <DialogDescription>{feedbackDescription}</DialogDescription>
              </DialogHeader>

              <Tabs
                value={feedbackType}
                onValueChange={(value) =>
                  setFeedbackType(value as FeedbackType)
                }
              >
                <TabsList className="w-full">
                  <TabsTrigger value="feature">Feature idea</TabsTrigger>
                  <TabsTrigger value="bug">Bug report</TabsTrigger>
                </TabsList>

                <form onSubmit={handleFeedbackSubmit}>
                  <TabsContent value="feature">
                    <FieldGroup>
                      <Field
                        data-invalid={Boolean(
                          feedbackSubmitted && featureErrors.email,
                        )}
                      >
                        <RequiredLabel>Email</RequiredLabel>
                        <Input
                          type="email"
                          value={featureValues.email}
                          onChange={(event) =>
                            setFeatureValues((current) => ({
                              ...current,
                              email: event.target.value,
                            }))
                          }
                          aria-invalid={Boolean(
                            feedbackSubmitted && featureErrors.email,
                          )}
                        />
                        {feedbackSubmitted && featureErrors.email ? (
                          <FieldError>{featureErrors.email}</FieldError>
                        ) : null}
                      </Field>

                      <Field
                        data-invalid={Boolean(
                          feedbackSubmitted && featureErrors.title,
                        )}
                      >
                        <RequiredLabel>Idea title</RequiredLabel>
                        <Input
                          value={featureValues.title}
                          onChange={(event) =>
                            setFeatureValues((current) => ({
                              ...current,
                              title: event.target.value,
                            }))
                          }
                          placeholder="What would you like us to add or improve?"
                          aria-invalid={Boolean(
                            feedbackSubmitted && featureErrors.title,
                          )}
                        />
                        {feedbackSubmitted && featureErrors.title ? (
                          <FieldError>{featureErrors.title}</FieldError>
                        ) : null}
                      </Field>

                      <Field
                        data-invalid={Boolean(
                          feedbackSubmitted && featureErrors.summary,
                        )}
                      >
                        <RequiredLabel>
                          What are you trying to do?
                        </RequiredLabel>
                        <Textarea
                          rows={5}
                          value={featureValues.summary}
                          onChange={(event) =>
                            setFeatureValues((current) => ({
                              ...current,
                              summary: event.target.value,
                            }))
                          }
                          aria-invalid={Boolean(
                            feedbackSubmitted && featureErrors.summary,
                          )}
                        />
                        {feedbackSubmitted && featureErrors.summary ? (
                          <FieldError>{featureErrors.summary}</FieldError>
                        ) : null}
                      </Field>

                      <Field
                        data-invalid={Boolean(
                          feedbackSubmitted && featureErrors.requestedChange,
                        )}
                      >
                        <RequiredLabel>What should change?</RequiredLabel>
                        <Textarea
                          rows={5}
                          value={featureValues.requestedChange}
                          onChange={(event) =>
                            setFeatureValues((current) => ({
                              ...current,
                              requestedChange: event.target.value,
                            }))
                          }
                          aria-invalid={Boolean(
                            feedbackSubmitted && featureErrors.requestedChange,
                          )}
                        />
                        {feedbackSubmitted && featureErrors.requestedChange ? (
                          <FieldError>
                            {featureErrors.requestedChange}
                          </FieldError>
                        ) : null}
                      </Field>

                      <Field>
                        <FieldLabel>How would this help you?</FieldLabel>
                        <Textarea
                          rows={4}
                          value={featureValues.impact ?? ""}
                          onChange={(event) =>
                            setFeatureValues((current) => ({
                              ...current,
                              impact: event.target.value,
                            }))
                          }
                        />
                      </Field>

                      <Field
                        data-invalid={Boolean(
                          feedbackSubmitted && featureErrors.area,
                        )}
                      >
                        <RequiredLabel>Area</RequiredLabel>
                        <Select
                          value={featureValues.area}
                          onValueChange={(value) =>
                            setFeatureValues((current) => ({
                              ...current,
                              area: value as FeatureFeedbackValues["area"],
                            }))
                          }
                        >
                          <SelectTrigger
                            className="w-full"
                            aria-invalid={Boolean(
                              feedbackSubmitted && featureErrors.area,
                            )}
                          >
                            <SelectValue placeholder="Choose an area" />
                          </SelectTrigger>
                          <SelectContent>
                            {featureAreaOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {feedbackSubmitted && featureErrors.area ? (
                          <FieldError>{featureErrors.area}</FieldError>
                        ) : null}
                      </Field>
                    </FieldGroup>
                  </TabsContent>

                  <TabsContent value="bug">
                    <FieldGroup>
                      <Field
                        data-invalid={Boolean(
                          feedbackSubmitted && bugErrors.email,
                        )}
                      >
                        <RequiredLabel>Email</RequiredLabel>
                        <Input
                          type="email"
                          value={bugValues.email}
                          onChange={(event) =>
                            setBugValues((current) => ({
                              ...current,
                              email: event.target.value,
                            }))
                          }
                          aria-invalid={Boolean(
                            feedbackSubmitted && bugErrors.email,
                          )}
                        />
                        {feedbackSubmitted && bugErrors.email ? (
                          <FieldError>{bugErrors.email}</FieldError>
                        ) : null}
                      </Field>

                      <Field
                        data-invalid={Boolean(
                          feedbackSubmitted && bugErrors.title,
                        )}
                      >
                        <RequiredLabel>Bug title</RequiredLabel>
                        <Input
                          value={bugValues.title}
                          onChange={(event) =>
                            setBugValues((current) => ({
                              ...current,
                              title: event.target.value,
                            }))
                          }
                          placeholder="Short description of the bug"
                          aria-invalid={Boolean(
                            feedbackSubmitted && bugErrors.title,
                          )}
                        />
                        {feedbackSubmitted && bugErrors.title ? (
                          <FieldError>{bugErrors.title}</FieldError>
                        ) : null}
                      </Field>

                      <Field
                        data-invalid={Boolean(
                          feedbackSubmitted && bugErrors.area,
                        )}
                      >
                        <RequiredLabel>Where is the problem?</RequiredLabel>
                        <Select
                          value={bugValues.area}
                          onValueChange={(value) =>
                            setBugValues((current) => ({
                              ...current,
                              area: value as BugFeedbackValues["area"],
                            }))
                          }
                        >
                          <SelectTrigger
                            className="w-full"
                            aria-invalid={Boolean(
                              feedbackSubmitted && bugErrors.area,
                            )}
                          >
                            <SelectValue placeholder="Choose an area" />
                          </SelectTrigger>
                          <SelectContent>
                            {bugAreaOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {feedbackSubmitted && bugErrors.area ? (
                          <FieldError>{bugErrors.area}</FieldError>
                        ) : null}
                      </Field>

                      <Field
                        data-invalid={Boolean(
                          feedbackSubmitted && bugErrors.summary,
                        )}
                      >
                        <RequiredLabel>What happened?</RequiredLabel>
                        <Textarea
                          rows={5}
                          value={bugValues.summary}
                          onChange={(event) =>
                            setBugValues((current) => ({
                              ...current,
                              summary: event.target.value,
                            }))
                          }
                          aria-invalid={Boolean(
                            feedbackSubmitted && bugErrors.summary,
                          )}
                        />
                        {feedbackSubmitted && bugErrors.summary ? (
                          <FieldError>{bugErrors.summary}</FieldError>
                        ) : null}
                      </Field>

                      <Field
                        data-invalid={Boolean(
                          feedbackSubmitted && bugErrors.expectedBehavior,
                        )}
                      >
                        <RequiredLabel>
                          What did you expect to happen?
                        </RequiredLabel>
                        <Textarea
                          rows={5}
                          value={bugValues.expectedBehavior}
                          onChange={(event) =>
                            setBugValues((current) => ({
                              ...current,
                              expectedBehavior: event.target.value,
                            }))
                          }
                          aria-invalid={Boolean(
                            feedbackSubmitted && bugErrors.expectedBehavior,
                          )}
                        />
                        {feedbackSubmitted && bugErrors.expectedBehavior ? (
                          <FieldError>{bugErrors.expectedBehavior}</FieldError>
                        ) : null}
                      </Field>

                      <Field>
                        <FieldLabel>Steps to reproduce</FieldLabel>
                        <Textarea
                          rows={4}
                          value={bugValues.reproSteps ?? ""}
                          onChange={(event) =>
                            setBugValues((current) => ({
                              ...current,
                              reproSteps: event.target.value,
                            }))
                          }
                          placeholder="1. Go to... 2. Click... 3. See error..."
                        />
                      </Field>
                    </FieldGroup>
                  </TabsContent>

                  {feedbackFormError ? (
                    <FieldError>{feedbackFormError}</FieldError>
                  ) : null}

                  <DialogFooter className="mt-6">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={closeFeedback}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={feedbackSending}>
                      {feedbackSending
                        ? "Sending..."
                        : feedbackType === "feature"
                          ? "Send feature idea"
                          : "Send bug report"}
                    </Button>
                  </DialogFooter>
                </form>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
