import z from "zod"

const supportCategoryValues = [
  "bio",
  "forms",
  "billing",
  "account",
  "bug",
  "other",
] as const

const featureAreaValues = [
  "bio",
  "forms",
  "analytics",
  "billing",
  "onboarding",
  "other",
] as const

const bugAreaValues = [
  "bio",
  "forms",
  "analytics",
  "billing",
  "account",
  "other",
] as const

export const supportCategoryOptions = [
  { value: "bio", label: "Bio page / links" },
  { value: "forms", label: "Forms / submissions" },
  { value: "billing", label: "Billing / plan" },
  { value: "account", label: "Account / sign-in" },
  { value: "bug", label: "Bug / technical problem" },
  { value: "other", label: "Other" },
] as const

export const featureAreaOptions = [
  { value: "bio", label: "Bio page" },
  { value: "forms", label: "Forms" },
  { value: "analytics", label: "Analytics" },
  { value: "billing", label: "Billing" },
  { value: "onboarding", label: "Onboarding" },
  { value: "other", label: "Other" },
] as const

export const bugAreaOptions = [
  { value: "bio", label: "Bio page" },
  { value: "forms", label: "Forms" },
  { value: "analytics", label: "Analytics" },
  { value: "billing", label: "Billing" },
  { value: "account", label: "Sign-in / account" },
  { value: "other", label: "Other" },
] as const

const requiredEmail = z.email("Enter a valid email address")

export const supportSchema = z.object({
  email: requiredEmail,
  subject: z.string().trim().min(1, "Subject is required"),
  category: z.enum(supportCategoryValues),
  message: z.string().trim().min(1, "Message is required"),
  routeContext: z.string().optional(),
})

export const feedbackTypeSchema = z.enum(["feature", "bug"])

export const featureFeedbackSchema = z.object({
  email: requiredEmail,
  title: z.string().trim().min(1, "Idea title is required"),
  area: z.enum(featureAreaValues),
  summary: z.string().trim().min(1, "Tell us what you are trying to do"),
  requestedChange: z.string().trim().min(1, "Tell us what should change"),
  impact: z.string().optional(),
})

export const bugFeedbackSchema = z.object({
  email: requiredEmail,
  title: z.string().trim().min(1, "Bug title is required"),
  area: z.enum(bugAreaValues),
  summary: z.string().trim().min(1, "Tell us what happened"),
  expectedBehavior: z
    .string()
    .trim()
    .min(1, "Tell us what you expected to happen"),
  reproSteps: z.string().optional(),
})

export type SupportFormValues = z.infer<typeof supportSchema>
export type FeatureFeedbackValues = z.infer<typeof featureFeedbackSchema>
export type BugFeedbackValues = z.infer<typeof bugFeedbackSchema>
export type FeedbackType = z.infer<typeof feedbackTypeSchema>

export function getFieldErrors<T extends Record<string, unknown>>(
  result: z.ZodError<T>,
) {
  return result.flatten().fieldErrors as Partial<Record<keyof T, string[]>>
}
