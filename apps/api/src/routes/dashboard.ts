import { Hono } from "hono"
import { and, asc, desc, eq } from "drizzle-orm"
import { createId, getDefaultTheme } from "@inbound/shared"
import { z } from "zod"
import { db } from "../db/client.ts"
import {
  accountMembers,
  accounts,
  forms,
  formSubmissions,
  links,
  messages,
  profiles,
  stripeSubscriptions,
  superUsers,
  threads,
  users,
} from "../db/schema.ts"
import { resolveAssetUrl, createUploadUrl } from "../integrations/storage.ts"
import {
  createCheckoutSession,
  createCustomerPortalSession,
} from "../integrations/stripe.ts"
import { sendSupportEmail } from "../integrations/resend.ts"
import { queryTinybirdEndpoint } from "../integrations/tinybird.ts"
import {
  sendThreadMessage,
  startFormBuilderThread,
  startThemeDesignerThread,
} from "../lib/agents.ts"
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

  const [superUser, subscription] = await Promise.all([
    db.query.superUsers.findFirst({
      where: eq(superUsers.userId, auth.user.id),
    }),
    db.query.stripeSubscriptions.findFirst({
      where: eq(stripeSubscriptions.accountId, auth.account.id),
      orderBy: [desc(stripeSubscriptions.updatedAt)],
    }),
  ])

  const subscribed =
    subscription?.status === "active" || subscription?.status === "trialing"

  return c.json({
    user: auth.user,
    account: auth.account,
    membership: auth.membership,
    subscribed: subscribed || auth.account.type === "team",
    plan:
      auth.account.type === "team"
        ? "team"
        : getPlanIdForPriceId(subscription?.priceId),
    isSuperUser: Boolean(superUser),
  })
})

dashboardRoutes.get("/profiles", async (c) => {
  const auth = c.get("auth")
  const rows = await db.query.profiles.findMany({
    where: eq(profiles.accountId, auth.account.id),
    orderBy: [asc(profiles.username)],
  })

  return c.json({
    profiles: await Promise.all(
      rows.map(async (p) => ({
        ...p,
        avatarUrl: await resolveAssetUrl(p.avatarKey),
        backgroundImageUrl: await resolveAssetUrl(p.backgroundImageKey),
      })),
    ),
  })
})

dashboardRoutes.get("/profiles/username-available", async (c) => {
  const username = c.req.query("username")?.trim().toLowerCase()
  if (!username || username.length < 2) {
    return c.json({ available: false })
  }

  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.username, username),
  })
  return c.json({ available: !existing })
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

  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.username, body.username),
  })
  if (existing) {
    return c.json({ error: "Username taken" }, 409)
  }

  const theme = getDefaultTheme()
  const id = createId()
  const now = Date.now()

  await db.insert(profiles).values({
    id,
    accountId: auth.account.id,
    userId: auth.user.id,
    username: body.username,
    title: body.title,
    bio: body.bio ?? "",
    theme: theme.name,
    backgroundColor: theme.backgroundColor,
    fontFamily: theme.fontFamily,
    textColor: theme.textColor,
    buttonShape: theme.buttonShape,
    buttonStyle: theme.buttonStyle,
    buttonColor: theme.buttonColor,
    buttonTextColor: theme.buttonTextColor,
    createdAt: now,
    updatedAt: now,
  })

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, id),
  })
  return c.json({ profile }, 201)
})

dashboardRoutes.get("/profiles/:id", async (c) => {
  const auth = c.get("auth")
  const profile = await db.query.profiles.findFirst({
    where: and(
      eq(profiles.id, c.req.param("id")),
      eq(profiles.accountId, auth.account.id),
    ),
  })
  if (!profile) return c.json({ error: "Not found" }, 404)

  const profileLinks = await db.query.links.findMany({
    where: eq(links.profileId, profile.id),
    orderBy: [asc(links.order)],
  })

  return c.json({
    profile: {
      ...profile,
      avatarUrl: await resolveAssetUrl(profile.avatarKey),
      backgroundImageUrl: await resolveAssetUrl(profile.backgroundImageKey),
    },
    links: profileLinks,
  })
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

  const existing = await db.query.profiles.findFirst({
    where: and(
      eq(profiles.id, c.req.param("id")),
      eq(profiles.accountId, auth.account.id),
    ),
  })
  if (!existing) return c.json({ error: "Not found" }, 404)

  await db
    .update(profiles)
    .set({ ...body, updatedAt: Date.now() })
    .where(eq(profiles.id, existing.id))

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, existing.id),
  })
  return c.json({ profile })
})

dashboardRoutes.post("/profiles/:id/links", async (c) => {
  const auth = c.get("auth")
  const profile = await db.query.profiles.findFirst({
    where: and(
      eq(profiles.id, c.req.param("id")),
      eq(profiles.accountId, auth.account.id),
    ),
  })
  if (!profile) return c.json({ error: "Not found" }, 404)

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

  const id = createId()
  await db.insert(links).values({
    id,
    userId: auth.user.id,
    profileId: profile.id,
    title: body.title,
    type: body.type,
    url: body.url ?? null,
    platform: body.platform ?? null,
    formId: body.formId ?? null,
    order: body.order ?? 0,
    active: body.active ?? true,
  })

  const link = await db.query.links.findFirst({ where: eq(links.id, id) })
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

  const existing = await db.query.links.findFirst({
    where: and(eq(links.id, c.req.param("id")), eq(links.userId, auth.user.id)),
  })
  if (!existing) return c.json({ error: "Not found" }, 404)

  await db.update(links).set(body).where(eq(links.id, existing.id))
  const link = await db.query.links.findFirst({
    where: eq(links.id, existing.id),
  })
  return c.json({ link })
})

dashboardRoutes.delete("/links/:id", async (c) => {
  const auth = c.get("auth")
  const existing = await db.query.links.findFirst({
    where: and(eq(links.id, c.req.param("id")), eq(links.userId, auth.user.id)),
  })
  if (!existing) return c.json({ error: "Not found" }, 404)
  await db.delete(links).where(eq(links.id, existing.id))
  return c.json({ ok: true })
})

dashboardRoutes.get("/forms", async (c) => {
  const auth = c.get("auth")
  const rows = await db.query.forms.findMany({
    where: eq(forms.userId, auth.user.id),
    orderBy: [desc(forms.updatedAt)],
  })
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

  const id = createId()
  const now = Date.now()
  await db.insert(forms).values({
    id,
    userId: auth.user.id,
    title: body.title,
    description: body.description ?? null,
    fields: body.fields ?? [],
    createdAt: now,
    updatedAt: now,
  })

  const form = await db.query.forms.findFirst({ where: eq(forms.id, id) })
  return c.json({ form }, 201)
})

dashboardRoutes.get("/forms/:id", async (c) => {
  const auth = c.get("auth")
  const form = await db.query.forms.findFirst({
    where: and(eq(forms.id, c.req.param("id")), eq(forms.userId, auth.user.id)),
  })
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

  const existing = await db.query.forms.findFirst({
    where: and(eq(forms.id, c.req.param("id")), eq(forms.userId, auth.user.id)),
  })
  if (!existing) return c.json({ error: "Not found" }, 404)

  await db
    .update(forms)
    .set({ ...body, updatedAt: Date.now() })
    .where(eq(forms.id, existing.id))

  const form = await db.query.forms.findFirst({
    where: eq(forms.id, existing.id),
  })
  return c.json({ form })
})

dashboardRoutes.get("/forms/:id/submissions", async (c) => {
  const auth = c.get("auth")
  const form = await db.query.forms.findFirst({
    where: and(eq(forms.id, c.req.param("id")), eq(forms.userId, auth.user.id)),
  })
  if (!form) return c.json({ error: "Not found" }, 404)

  const submissions = await db.query.formSubmissions.findMany({
    where: eq(formSubmissions.formId, form.id),
    orderBy: [desc(formSubmissions.createdAt)],
  })
  return c.json({ submissions })
})

dashboardRoutes.post("/threads/theme-designer", async (c) => {
  const auth = c.get("auth")
  const body = z.object({ profileId: z.string() }).parse(await c.req.json())
  const threadId = await startThemeDesignerThread({
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
  const threadId = await startFormBuilderThread({
    userId: auth.user.id,
    profileId: body.profileId,
  })
  return c.json({ threadId }, 201)
})

dashboardRoutes.get("/threads/:id/messages", async (c) => {
  const auth = c.get("auth")
  const thread = await db.query.threads.findFirst({
    where: and(
      eq(threads.id, c.req.param("id")),
      eq(threads.userId, auth.user.id),
    ),
  })
  if (!thread) return c.json({ error: "Not found" }, 404)

  const rows = await db.query.messages.findMany({
    where: eq(messages.threadId, thread.id),
    orderBy: [asc(messages.createdAt)],
  })
  return c.json({ thread, messages: rows })
})

dashboardRoutes.post("/threads/:id/messages", async (c) => {
  const auth = c.get("auth")
  const thread = await db.query.threads.findFirst({
    where: and(
      eq(threads.id, c.req.param("id")),
      eq(threads.userId, auth.user.id),
    ),
  })
  if (!thread) return c.json({ error: "Not found" }, 404)

  const body = z.object({ message: z.string().min(1) }).parse(await c.req.json())
  await sendThreadMessage({ threadId: thread.id, message: body.message })
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
  const superUser = await db.query.superUsers.findFirst({
    where: eq(superUsers.userId, auth.user.id),
  })
  if (!superUser) {
    return c.json({ error: "Forbidden" }, 403)
  }

  const [allUsers, memberships, allAccounts] = await Promise.all([
    db.query.users.findMany(),
    db.query.accountMembers.findMany(),
    db.query.accounts.findMany(),
  ])

  const membershipsByUserId = new Map(
    memberships.map((membership) => [membership.userId, membership]),
  )
  const accountsById = new Map(
    allAccounts.map((account) => [account.id, account]),
  )
  const roleOrder = { owner: 0, admin: 1, member: 2 } as const

  const result = allUsers
    .map((user) => {
      const membership = membershipsByUserId.get(user.id)
      if (!membership) {
        return null
      }
      const account = accountsById.get(membership.accountId)
      return {
        userId: user.id,
        accountId: membership.accountId,
        accountType: account?.type ?? null,
        name: user.name ?? user.email ?? "Unknown user",
        email: user.email ?? "",
        role: membership.role,
        canSetupStripe: membership.role === "owner",
      }
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => {
      const byRole = roleOrder[a.role] - roleOrder[b.role]
      if (byRole !== 0) return byRole
      const byName = a.name.localeCompare(b.name)
      if (byName !== 0) return byName
      return a.email.localeCompare(b.email)
    })

  return c.json({ users: result })
})

dashboardRoutes.post("/profiles/:id/links/reorder", async (c) => {
  const auth = c.get("auth")
  const profileId = c.req.param("id")
  const body = z
    .object({
      linkIds: z.array(z.string()).min(1),
    })
    .parse(await c.req.json())

  const profile = await db.query.profiles.findFirst({
    where: and(
      eq(profiles.id, profileId),
      eq(profiles.accountId, auth.account.id),
    ),
  })
  if (!profile) return c.json({ error: "Not found" }, 404)

  await Promise.all(
    body.linkIds.map((linkId, index) =>
      db
        .update(links)
        .set({ order: index })
        .where(and(eq(links.id, linkId), eq(links.profileId, profileId))),
    ),
  )

  return c.json({ ok: true })
})

dashboardRoutes.get(
  "/forms/:id/submissions/:submissionId/transcript",
  async (c) => {
    const auth = c.get("auth")
    const formId = c.req.param("id")
    const submissionId = c.req.param("submissionId")

    const form = await db.query.forms.findFirst({
      where: and(eq(forms.id, formId), eq(forms.userId, auth.user.id)),
    })
    if (!form) return c.json({ error: "Not found" }, 404)

    const submission = await db.query.formSubmissions.findFirst({
      where: and(
        eq(formSubmissions.id, submissionId),
        eq(formSubmissions.formId, formId),
      ),
    })
    if (!submission) return c.json({ error: "Not found" }, 404)

    const thread = await db.query.threads.findFirst({
      where: eq(threads.formSubmissionId, submissionId),
    })

    const transcriptMessages = thread
      ? await db.query.messages.findMany({
          where: eq(messages.threadId, thread.id),
          orderBy: [asc(messages.createdAt)],
        })
      : []

    return c.json({
      submission,
      messages: transcriptMessages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
        status: m.status,
      })),
    })
  },
)
