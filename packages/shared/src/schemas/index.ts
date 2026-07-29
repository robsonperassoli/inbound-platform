import { z } from "zod"

export const buttonShapeSchema = z.enum(["square", "rounded", "pill"])
export type ButtonShape = z.infer<typeof buttonShapeSchema>

export const buttonStyleSchema = z.enum([
  "solid",
  "outline",
  "paper",
  "shadow",
  "3d",
  "ghost",
])
export type ButtonStyle = z.infer<typeof buttonStyleSchema>

export const socialPlatformSchema = z.enum([
  "instagram",
  "tiktok",
  "x",
  "youtube",
  "facebook",
  "linkedin",
])
export type SocialPlatform = z.infer<typeof socialPlatformSchema>

export const linkTypeSchema = z.enum(["url", "social", "form"])
export type LinkType = z.infer<typeof linkTypeSchema>

export const memberRoleSchema = z.enum(["owner", "admin", "member"])
export type MemberRole = z.infer<typeof memberRoleSchema>

export const accountTypeSchema = z.enum(["team", "individual"])
export type AccountType = z.infer<typeof accountTypeSchema>

export const formFieldTypeSchema = z.enum([
  "shortText",
  "longText",
  "email",
  "phoneNumber",
  "number",
  "select",
  "checkbox",
  "date",
  "dateTime",
])

export const formFieldSchema = z.object({
  id: z.string(),
  type: formFieldTypeSchema,
  label: z.string(),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
})
export type FormField = z.infer<typeof formFieldSchema>

export const formSubmissionValueSchema = z.union([
  z.string(),
  z.number(),
  z.array(z.string()),
  z.boolean(),
])
export type FormSubmissionValue = z.infer<typeof formSubmissionValueSchema>

export const threadTypeSchema = z.enum([
  "formSubmission",
  "formBuilder",
  "themeDesigner",
])
export type ThreadType = z.infer<typeof threadTypeSchema>

export const messageRoleSchema = z.enum(["user", "assistant", "system"])
export const messageStatusSchema = z.enum([
  "pending",
  "complete",
  "streaming",
  "error",
])

export const publicProfileSchema = z.object({
  id: z.string(),
  username: z.string(),
  title: z.string(),
  bio: z.string(),
  avatarUrl: z.string().nullable(),
  backgroundImageUrl: z.string().nullable(),
  publishedAt: z.number().nullable(),
  theme: z.string(),
  backgroundColor: z.string(),
  fontFamily: z.string(),
  textColor: z.string(),
  buttonShape: buttonShapeSchema,
  buttonStyle: buttonStyleSchema,
  buttonColor: z.string(),
  buttonTextColor: z.string(),
})
export type PublicProfile = z.infer<typeof publicProfileSchema>

export const publicLinkSchema = z.object({
  id: z.string(),
  title: z.string(),
  order: z.number(),
  active: z.boolean(),
  type: linkTypeSchema,
  formId: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  platform: socialPlatformSchema.nullable().optional(),
})
export type PublicLink = z.infer<typeof publicLinkSchema>

export const publicProfileResponseSchema = z.object({
  profile: publicProfileSchema,
  links: z.array(publicLinkSchema),
})
export type PublicProfileResponse = z.infer<typeof publicProfileResponseSchema>

export const userPageProfileSchema = z.object({
  title: z.string(),
  bio: z.string(),
  avatarUrl: z.string().nullable(),
  backgroundImageUrl: z.string().nullable(),
  backgroundColor: z.string(),
  fontFamily: z.string(),
  textColor: z.string(),
  buttonShape: buttonShapeSchema,
  buttonStyle: buttonStyleSchema,
  buttonColor: z.string(),
  buttonTextColor: z.string(),
})
export type UserPageProfile = z.infer<typeof userPageProfileSchema>

export const userPageLinkSchema = z.object({
  id: z.string(),
  type: linkTypeSchema,
  title: z.string(),
  url: z.string().optional(),
  formId: z.string().optional(),
  platform: socialPlatformSchema.optional(),
})
export type UserPageLink = z.infer<typeof userPageLinkSchema>

export const publicMessageSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  role: messageRoleSchema,
  content: z.string(),
  status: messageStatusSchema,
  createdAt: z.number(),
})
export type PublicMessage = z.infer<typeof publicMessageSchema>

export const startFormSessionInputSchema = z.object({
  profileId: z.string(),
  formId: z.string(),
})

export const sendFormSessionMessageInputSchema = z.object({
  sessionId: z.string(),
  message: z.string().min(1),
})
