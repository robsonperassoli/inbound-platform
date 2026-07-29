import { createId } from "@inbound/shared"
import { sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => createId())

const createdAt = () =>
  integer("created_at", { mode: "number" })
    .notNull()
    .$defaultFn(() => Date.now())

export const users = sqliteTable("users", {
  id: id(),
  authId: text("auth_id"),
  email: text("email"),
  name: text("name"),
  profilePictureUrl: text("profile_picture_url"),
  createdAt: createdAt(),
})

export const accounts = sqliteTable("accounts", {
  id: id(),
  type: text("type", { enum: ["team", "individual"] }).notNull(),
  createdAt: createdAt(),
})

export const accountMembers = sqliteTable("account_members", {
  id: id(),
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  role: text("role", { enum: ["owner", "admin", "member"] }).notNull(),
  profiles: text("profiles", { mode: "json" })
    .$type<string[]>()
    .notNull()
    .default(sql`'["all"]'`),
  joinedAt: integer("joined_at", { mode: "number" }).notNull(),
})

export const invitations = sqliteTable("invitations", {
  id: id(),
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id),
  token: text("token").notNull(),
  email: text("email").notNull(),
  role: text("role", { enum: ["owner", "admin", "member"] }).notNull(),
  profiles: text("profiles", { mode: "json" })
    .$type<string[]>()
    .notNull(),
  status: text("status", {
    enum: ["pending", "accepted", "revoked"],
  }).notNull(),
  expiresAt: integer("expires_at", { mode: "number" }).notNull(),
  acceptedByUserId: text("accepted_by_user_id"),
  acceptedAt: integer("accepted_at", { mode: "number" }),
  invitedByUserId: text("invited_by_user_id")
    .notNull()
    .references(() => users.id),
  revokedAt: integer("revoked_at", { mode: "number" }),
})

export const profiles = sqliteTable("profiles", {
  id: id(),
  accountId: text("account_id").references(() => accounts.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  username: text("username").notNull().unique(),
  title: text("title").notNull(),
  bio: text("bio").notNull().default(""),
  avatarKey: text("avatar_key"),
  backgroundImageKey: text("background_image_key"),
  publishedAt: integer("published_at", { mode: "number" }),
  theme: text("theme").notNull().default("Pearl White"),
  backgroundColor: text("background_color").notNull().default("#FFFFFF"),
  fontFamily: text("font_family").notNull().default("Inter"),
  textColor: text("text_color").notNull().default("#1E293B"),
  buttonShape: text("button_shape", {
    enum: ["square", "rounded", "pill"],
  })
    .notNull()
    .default("pill"),
  buttonStyle: text("button_style", {
    enum: ["solid", "outline", "paper", "shadow", "3d", "ghost"],
  })
    .notNull()
    .default("solid"),
  buttonColor: text("button_color").notNull().default("#1E293B"),
  buttonTextColor: text("button_text_color").notNull().default("#FFFFFF"),
  createdAt: createdAt(),
  updatedAt: integer("updated_at", { mode: "number" })
    .notNull()
    .$defaultFn(() => Date.now()),
})

export const links = sqliteTable("links", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  profileId: text("profile_id")
    .notNull()
    .references(() => profiles.id),
  title: text("title").notNull(),
  order: integer("order").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  type: text("type", { enum: ["url", "social", "form"] }).notNull(),
  formId: text("form_id"),
  url: text("url"),
  platform: text("platform", {
    enum: ["instagram", "tiktok", "x", "youtube", "facebook", "linkedin"],
  }),
  createdAt: createdAt(),
})

export const forms = sqliteTable("forms", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  fields: text("fields", { mode: "json" })
    .$type<
      Array<{
        id: string
        type: string
        label: string
        required: boolean
        options?: string[]
      }>
    >()
    .notNull()
    .default(sql`'[]'`),
  publishedAt: integer("published_at", { mode: "number" }),
  createdAt: createdAt(),
  updatedAt: integer("updated_at", { mode: "number" })
    .notNull()
    .$defaultFn(() => Date.now()),
})

export const formSubmissions = sqliteTable("form_submissions", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  formId: text("form_id")
    .notNull()
    .references(() => forms.id),
  values: text("values", { mode: "json" })
    .$type<Record<string, string | number | boolean | string[]>>()
    .notNull()
    .default(sql`'{}'`),
  completedAt: integer("completed_at", { mode: "number" }),
  createdAt: createdAt(),
  updatedAt: integer("updated_at", { mode: "number" })
    .notNull()
    .$defaultFn(() => Date.now()),
})

export const threads = sqliteTable("threads", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title").notNull(),
  model: text("model").notNull().default("gpt-4o-mini"),
  systemPrompt: text("system_prompt").notNull(),
  type: text("type", {
    enum: ["formSubmission", "formBuilder", "themeDesigner"],
  }).notNull(),
  formId: text("form_id"),
  formSubmissionId: text("form_submission_id"),
  profileId: text("profile_id"),
  sessionEndedAt: integer("session_ended_at", { mode: "number" }),
  lastUserMessageAt: integer("last_user_message_at", { mode: "number" }),
  createdAt: createdAt(),
  updatedAt: integer("updated_at", { mode: "number" })
    .notNull()
    .$defaultFn(() => Date.now()),
})

export const messages = sqliteTable("messages", {
  id: id(),
  threadId: text("thread_id")
    .notNull()
    .references(() => threads.id),
  role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
  content: text("content").notNull(),
  status: text("status", {
    enum: ["pending", "complete", "streaming", "error"],
  })
    .notNull()
    .default("complete"),
  createdAt: createdAt(),
})

export const superUsers = sqliteTable("super_users", {
  id: id(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id)
    .unique(),
})

export const stripeCustomers = sqliteTable("stripe_customers", {
  id: id(),
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id)
    .unique(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  stripeCustomerId: text("stripe_customer_id").notNull().unique(),
  email: text("email"),
  createdAt: createdAt(),
})

export const stripeSubscriptions = sqliteTable("stripe_subscriptions", {
  id: id(),
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
  status: text("status").notNull(),
  priceId: text("price_id"),
  planType: text("plan_type"),
  currentPeriodEnd: integer("current_period_end", { mode: "number" }),
  createdAt: createdAt(),
  updatedAt: integer("updated_at", { mode: "number" })
    .notNull()
    .$defaultFn(() => Date.now()),
})

export type User = typeof users.$inferSelect
export type Profile = typeof profiles.$inferSelect
export type Link = typeof links.$inferSelect
export type Form = typeof forms.$inferSelect
export type Thread = typeof threads.$inferSelect
export type Message = typeof messages.$inferSelect
