import { Hono } from "hono"
import { z } from "zod"
import * as accounts from "../domains/accounts/index.ts"
import * as billing from "../domains/billing/index.ts"
import * as chat from "../domains/chat/index.ts"
import * as forms from "../domains/forms/index.ts"
import * as profiles from "../domains/profiles/index.ts"
import { createUploadUrl } from "../integrations/storage.ts"
import {
  createCheckoutSession,
  createCustomerPortalSession,
} from "../integrations/stripe.ts"
import { sendSupportEmail } from "../integrations/resend.ts"
import { queryTinybirdEndpoint } from "../integrations/tinybird.ts"
import { getPlanIdForPriceId, getStripePriceId } from "../lib/pricing.ts"
import { requireAuth } from "../middleware/auth.ts"
import type { AuthContext } from "../middleware/auth.ts"

export const dashboardRoutes = new Hono<{
  Variables: {
    auth: AuthContext
  }
}>()

dashboardRoutes.use("*", requireAuth)

dashboardRoutes.get("/me", async (c) => {
  const auth = c.get("auth")

  const [isSuperUser, billingState] = await Promise.all([
    accounts.isSuperUser(auth.user.id),
    billing.getMeBillingState(auth.account.id, auth.account.type),
  ])

  return c.json({
    user: auth.user,
    account: auth.account,
    membership: auth.membership,
    subscribed: billingState.subscribed,
    plan:
      auth.account.type === "team"
        ? "team"
        : getPlanIdForPriceId(billingState.subscription?.priceId),
    isSuperUser,
  })
})

dashboardRoutes.get("/profiles", async (c) => {
  const auth = c.get("auth")
  const rows = await profiles.listAccountProfiles(auth.account.id)
  return c.json({ profiles: rows })
})

dashboardRoutes.get("/profiles/username-available", async (c) => {
  const username = c.req.query("username")?.trim().toLowerCase()
  if (!username || username.length < 2) {
    return c.json({ available: false })
  }

  const available = await profiles.isUsernameAvailable(username)
  return c.json({ available })
})

dashboardRoutes.post("/profiles", async (c) => {
  const auth = c.get("auth")
  const body = z
    .object({
      username: z.string().min(2).max(40),
      title: z.string().min(1),
      bio: z.string().optional(),
    })
    .parse(await c.req.json())

  try {
    const profile = await profiles.createProfile({
      accountId: auth.account.id,
      userId: auth.user.id,
      username: body.username,
      title: body.title,
      bio: body.bio,
    })
    return c.json({ profile }, 201)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bad request"
    if (message === "Username taken") {
      return c.json({ error: message }, 409)
    }
    throw error
  }
})

dashboardRoutes.get("/profiles/:id", async (c) => {
  const auth = c.get("auth")
  const data = await profiles.getProfileWithLinks(
    c.req.param("id"),
    auth.account.id,
  )
  if (!data) return c.json({ error: "Not found" }, 404)
  return c.json(data)
})

dashboardRoutes.patch("/profiles/:id", async (c) => {
  const auth = c.get("auth")
  const body = z
    .object({
      title: z.string().optional(),
      bio: z.string().optional(),
      theme: z.string().optional(),
      backgroundColor: z.string().optional(),
      fontFamily: z.string().optional(),
      textColor: z.string().optional(),
      buttonShape: z.enum(["square", "rounded", "pill"]).optional(),
      buttonStyle: z
        .enum(["solid", "outline", "paper", "shadow", "3d", "ghost"])
        .optional(),
      buttonColor: z.string().optional(),
      buttonTextColor: z.string().optional(),
      avatarKey: z.string().nullable().optional(),
      backgroundImageKey: z.string().nullable().optional(),
      publishedAt: z.number().nullable().optional(),
    })
    .parse(await c.req.json())

  const profile = await profiles.updateProfileForAccount(
    c.req.param("id"),
    auth.account.id,
    body,
  )
  if (!profile) return c.json({ error: "Not found" }, 404)
  return c.json({ profile })
})

dashboardRoutes.post("/profiles/:id/links", async (c) => {
  const auth = c.get("auth")
  const body = z
    .object({
      title: z.string(),
      type: z.enum(["url", "social", "form"]),
      url: z.string().optional(),
      platform: z
        .enum(["instagram", "tiktok", "x", "youtube", "facebook", "linkedin"])
        .optional(),
      formId: z.string().optional(),
      order: z.number().optional(),
      active: z.boolean().optional(),
    })
    .parse(await c.req.json())

  const link = await profiles.createLinkForProfile({
    profileId: c.req.param("id"),
    accountId: auth.account.id,
    userId: auth.user.id,
    ...body,
  })
  if (!link) return c.json({ error: "Not found" }, 404)
  return c.json({ link }, 201)
})

dashboardRoutes.patch("/links/:id", async (c) => {
  const auth = c.get("auth")
  const body = z
    .object({
      title: z.string().optional(),
      url: z.string().nullable().optional(),
      order: z.number().optional(),
      active: z.boolean().optional(),
      platform: z
        .enum(["instagram", "tiktok", "x", "youtube", "facebook", "linkedin"])
        .nullable()
        .optional(),
      formId: z.string().nullable().optional(),
    })
    .parse(await c.req.json())

  const link = await profiles.updateLinkForUser(
    c.req.param("id"),
    auth.user.id,
    body,
  )
  if (!link) return c.json({ error: "Not found" }, 404)
  return c.json({ link })
})

dashboardRoutes.delete("/links/:id", async (c) => {
  const auth = c.get("auth")
  const ok = await profiles.deleteLinkForUser(c.req.param("id"), auth.user.id)
  if (!ok) return c.json({ error: "Not found" }, 404)
  return c.json({ ok: true })
})

dashboardRoutes.get("/forms", async (c) => {
  const auth = c.get("auth")
  const rows = await forms.listFormsForUser(auth.user.id)
  return c.json({ forms: rows })
})

dashboardRoutes.post("/forms", async (c) => {
  const auth = c.get("auth")
  const body = z
    .object({
      title: z.string(),
      description: z.string().optional(),
      fields: z
        .array(
          z.object({
            id: z.string(),
            type: z.string(),
            label: z.string(),
            required: z.boolean(),
            options: z.array(z.string()).optional(),
          }),
        )
        .optional(),
    })
    .parse(await c.req.json())

  const form = await forms.createFormForUser({
    userId: auth.user.id,
    title: body.title,
    description: body.description ?? null,
    fields: body.fields,
  })
  return c.json({ form }, 201)
})

dashboardRoutes.get("/forms/:id", async (c) => {
  const auth = c.get("auth")
  const form = await forms.getFormForUser(c.req.param("id"), auth.user.id)
  if (!form) return c.json({ error: "Not found" }, 404)
  return c.json({ form })
})

dashboardRoutes.patch("/forms/:id", async (c) => {
  const auth = c.get("auth")
  const body = z
    .object({
      title: z.string().optional(),
      description: z.string().nullable().optional(),
      fields: z
        .array(
          z.object({
            id: z.string(),
            type: z.string(),
            label: z.string(),
            required: z.boolean(),
            options: z.array(z.string()).optional(),
          }),
        )
        .optional(),
      publishedAt: z.number().nullable().optional(),
    })
    .parse(await c.req.json())

  const form = await forms.updateFormForUser(
    c.req.param("id"),
    auth.user.id,
    body,
  )
  if (!form) return c.json({ error: "Not found" }, 404)
  return c.json({ form })
})

dashboardRoutes.get("/forms/:id/submissions", async (c) => {
  const auth = c.get("auth")
  const result = await forms.listSubmissionsForUserForm(
    c.req.param("id"),
    auth.user.id,
  )
  if (!result) return c.json({ error: "Not found" }, 404)
  return c.json({ submissions: result.submissions })
})

dashboardRoutes.post("/threads/theme-designer", async (c) => {
  const auth = c.get("auth")
  const body = z.object({ profileId: z.string() }).parse(await c.req.json())
  const threadId = await chat.startThemeDesignerThread({
    userId: auth.user.id,
    profileId: body.profileId,
  })
  return c.json({ threadId }, 201)
})

dashboardRoutes.post("/threads/form-builder", async (c) => {
  const auth = c.get("auth")
  const body = z
    .object({ profileId: z.string().optional() })
    .parse(await c.req.json().catch(() => ({})))
  const threadId = await chat.startFormBuilderThread({
    userId: auth.user.id,
    profileId: body.profileId,
  })
  return c.json({ threadId }, 201)
})

dashboardRoutes.get("/threads/:id/messages", async (c) => {
  const auth = c.get("auth")
  const data = await chat.getThreadWithMessages(
    c.req.param("id"),
    auth.user.id,
  )
  if (!data) return c.json({ error: "Not found" }, 404)
  return c.json(data)
})

dashboardRoutes.post("/threads/:id/messages", async (c) => {
  const auth = c.get("auth")
  const thread = await chat.getThreadForUser(c.req.param("id"), auth.user.id)
  if (!thread) return c.json({ error: "Not found" }, 404)

  const body = z.object({ message: z.string().min(1) }).parse(await c.req.json())
  await chat.sendThreadMessage({ threadId: thread.id, message: body.message })
  return c.json({ ok: true })
})

dashboardRoutes.post("/uploads/presign", async (c) => {
  const body = z
    .object({
      key: z.string(),
      contentType: z.string(),
    })
    .parse(await c.req.json())

  const url = await createUploadUrl(body.key, body.contentType)
  return c.json({ url, key: body.key })
})

dashboardRoutes.post("/billing/checkout", async (c) => {
  const auth = c.get("auth")
  const body = z
    .object({
      plan: z.enum(["starter", "pro"]),
      cycle: z.enum(["monthly", "yearly"]).default("yearly"),
    })
    .parse(await c.req.json())

  let priceId: string
  try {
    priceId = getStripePriceId(body.plan, body.cycle)
  } catch (error) {
    return c.json(
      {
        error: error instanceof Error ? error.message : "Price not configured",
      },
      400,
    )
  }

  const session = await createCheckoutSession({
    accountId: auth.account.id,
    userId: auth.user.id,
    email: auth.user.email,
    name: auth.user.name,
    priceId,
    planType: body.plan,
  })
  return c.json(session)
})

dashboardRoutes.post("/billing/portal", async (c) => {
  const auth = c.get("auth")
  const session = await createCustomerPortalSession(auth.account.id)
  if (!session) return c.json({ error: "No customer" }, 404)
  return c.json(session)
})

dashboardRoutes.get("/analytics/overview", async (c) => {
  const profileId = c.req.query("profileId")
  const startDate = c.req.query("startDate")
  const endDate = c.req.query("endDate")
  if (!profileId || !startDate || !endDate) {
    return c.json({ error: "profileId, startDate, endDate required" }, 400)
  }

  const params = {
    profile_id: profileId,
    start_date: startDate,
    end_date: endDate,
  }

  const [overview, linkClicks, deviceBreakdown, referrerBreakdown] =
    await Promise.all([
      queryTinybirdEndpoint("overview", params),
      queryTinybirdEndpoint("link_clicks_by_link", {
        ...params,
        limit: "10",
        offset: "0",
      }),
      queryTinybirdEndpoint("device_breakdown", { ...params, limit: "10" }),
      queryTinybirdEndpoint("referrer_breakdown", { ...params, limit: "20" }),
    ])

  return c.json({
    overview: overview.data?.[0] ?? null,
    linkClicks: linkClicks.data ?? null,
    deviceBreakdown: deviceBreakdown.data ?? null,
    referrerBreakdown: referrerBreakdown.data ?? null,
  })
})

dashboardRoutes.post("/support", async (c) => {
  const auth = c.get("auth")
  const body = z.object({ message: z.string().min(1) }).parse(await c.req.json())
  await sendSupportEmail({
    fromEmail: auth.user.email ?? "unknown@inbound.click",
    message: body.message,
  })
  return c.json({ ok: true })
})

dashboardRoutes.post("/feedback", async (c) => {
  const auth = c.get("auth")
  const body = z.object({ message: z.string().min(1) }).parse(await c.req.json())
  await sendSupportEmail({
    fromEmail: auth.user.email ?? "unknown@inbound.click",
    message: `[Feedback]\n${body.message}`,
  })
  return c.json({ ok: true })
})

dashboardRoutes.get("/system/users", async (c) => {
  const auth = c.get("auth")
  if (!(await accounts.isSuperUser(auth.user.id))) {
    return c.json({ error: "Forbidden" }, 403)
  }

  const users = await accounts.listSystemUsers()
  return c.json({ users })
})

dashboardRoutes.post("/profiles/:id/links/reorder", async (c) => {
  const auth = c.get("auth")
  const body = z
    .object({
      linkIds: z.array(z.string()).min(1),
    })
    .parse(await c.req.json())

  const ok = await profiles.reorderLinksForProfile({
    profileId: c.req.param("id"),
    accountId: auth.account.id,
    linkIds: body.linkIds,
  })
  if (!ok) return c.json({ error: "Not found" }, 404)
  return c.json({ ok: true })
})

dashboardRoutes.get(
  "/forms/:id/submissions/:submissionId/transcript",
  async (c) => {
    const auth = c.get("auth")
    const formId = c.req.param("id")
    const submissionId = c.req.param("submissionId")

    const result = await forms.getSubmissionForUserForm(
      formId,
      submissionId,
      auth.user.id,
    )
    if (!result) return c.json({ error: "Not found" }, 404)

    const messages = await chat.getSubmissionTranscript(submissionId)

    return c.json({
      submission: result.submission,
      messages,
    })
  },
)
