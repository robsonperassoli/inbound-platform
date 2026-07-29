import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { z } from "zod"
import * as accounts from "../domains/accounts/index"
import * as billing from "../domains/billing/index"
import * as chat from "../domains/chat/index"
import * as forms from "../domains/forms/index"
import * as profiles from "../domains/profiles/index"
import { createUploadUrl } from "../integrations/storage"
import {
  createCheckoutSession,
  createCustomerPortalSession,
} from "../integrations/stripe"
import { sendSupportEmail } from "../integrations/resend"
import { queryTinybirdEndpoint } from "../integrations/tinybird"
import { getPlanIdForPriceId, getStripePriceId } from "../lib/pricing"
import { requireAuth } from "../middleware/auth"
import type { AuthContext } from "../middleware/auth"

const createProfileBodySchema = z.object({
  username: z.string().min(2).max(40),
  title: z.string().min(1),
  bio: z.string().optional(),
})

const updateProfileBodySchema = z.object({
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

const createLinkBodySchema = z.object({
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

const updateLinkBodySchema = z.object({
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

const formFieldSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string(),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
})

const createFormBodySchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  fields: z.array(formFieldSchema).optional(),
})

const updateFormBodySchema = z.object({
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  fields: z.array(formFieldSchema).optional(),
  publishedAt: z.number().nullable().optional(),
})

export const dashboardRoutes = new Hono<{
  Variables: {
    auth: AuthContext
  }
}>()
  .use("*", requireAuth)
  .get("/me", async (c) => {
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
  .get("/profiles", async (c) => {
    const auth = c.get("auth")
    const rows = await profiles.listAccountProfiles(auth.account.id)
    return c.json({ profiles: rows })
  })
  .get(
    "/profiles/username-available",
    zValidator(
      "query",
      z.object({
        username: z.string().optional(),
      }),
    ),
    async (c) => {
      const username = c.req.valid("query").username?.trim().toLowerCase()
      if (!username || username.length < 2) {
        return c.json({ available: false })
      }

      const available = await profiles.isUsernameAvailable(username)
      return c.json({ available })
    },
  )
  .post("/profiles", zValidator("json", createProfileBodySchema), async (c) => {
    const auth = c.get("auth")
    const body = c.req.valid("json")

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
  .get("/profiles/:id", async (c) => {
    const auth = c.get("auth")
    const data = await profiles.getProfileWithLinks(
      c.req.param("id"),
      auth.account.id,
    )
    if (!data) return c.json({ error: "Not found" }, 404)
    return c.json(data)
  })
  .patch(
    "/profiles/:id",
    zValidator("json", updateProfileBodySchema),
    async (c) => {
      const auth = c.get("auth")
      const body = c.req.valid("json")

      const profile = await profiles.updateProfileForAccount(
        c.req.param("id"),
        auth.account.id,
        body,
      )
      if (!profile) return c.json({ error: "Not found" }, 404)
      return c.json({ profile })
    },
  )
  .post(
    "/profiles/:id/links",
    zValidator("json", createLinkBodySchema),
    async (c) => {
      const auth = c.get("auth")
      const body = c.req.valid("json")

      const link = await profiles.createLinkForProfile({
        profileId: c.req.param("id"),
        accountId: auth.account.id,
        userId: auth.user.id,
        ...body,
      })
      if (!link) return c.json({ error: "Not found" }, 404)
      return c.json({ link }, 201)
    },
  )
  .patch("/links/:id", zValidator("json", updateLinkBodySchema), async (c) => {
    const auth = c.get("auth")
    const body = c.req.valid("json")

    const link = await profiles.updateLinkForUser(
      c.req.param("id"),
      auth.user.id,
      body,
    )
    if (!link) return c.json({ error: "Not found" }, 404)
    return c.json({ link })
  })
  .delete("/links/:id", async (c) => {
    const auth = c.get("auth")
    const ok = await profiles.deleteLinkForUser(c.req.param("id"), auth.user.id)
    if (!ok) return c.json({ error: "Not found" }, 404)
    return c.json({ ok: true })
  })
  .get("/forms", async (c) => {
    const auth = c.get("auth")
    const rows = await forms.listFormsForUser(auth.user.id)
    return c.json({ forms: rows })
  })
  .post("/forms", zValidator("json", createFormBodySchema), async (c) => {
    const auth = c.get("auth")
    const body = c.req.valid("json")

    const form = await forms.createFormForUser({
      userId: auth.user.id,
      title: body.title,
      description: body.description ?? null,
      fields: body.fields,
    })
    return c.json({ form }, 201)
  })
  .get("/forms/:id", async (c) => {
    const auth = c.get("auth")
    const form = await forms.getFormForUser(c.req.param("id"), auth.user.id)
    if (!form) return c.json({ error: "Not found" }, 404)
    return c.json({ form })
  })
  .patch(
    "/forms/:id",
    zValidator("json", updateFormBodySchema),
    async (c) => {
      const auth = c.get("auth")
      const body = c.req.valid("json")

      const form = await forms.updateFormForUser(
        c.req.param("id"),
        auth.user.id,
        body,
      )
      if (!form) return c.json({ error: "Not found" }, 404)
      return c.json({ form })
    },
  )
  .get("/forms/:id/submissions", async (c) => {
    const auth = c.get("auth")
    const result = await forms.listSubmissionsForUserForm(
      c.req.param("id"),
      auth.user.id,
    )
    if (!result) return c.json({ error: "Not found" }, 404)
    return c.json({ submissions: result.submissions })
  })
  .post(
    "/threads/theme-designer",
    zValidator("json", z.object({ profileId: z.string() })),
    async (c) => {
      const auth = c.get("auth")
      const body = c.req.valid("json")
      const threadId = await chat.startThemeDesignerThread({
        userId: auth.user.id,
        profileId: body.profileId,
      })
      return c.json({ threadId }, 201)
    },
  )
  .post(
    "/threads/form-builder",
    zValidator("json", z.object({ profileId: z.string().optional() })),
    async (c) => {
      const auth = c.get("auth")
      const body = c.req.valid("json")
      const threadId = await chat.startFormBuilderThread({
        userId: auth.user.id,
        profileId: body.profileId,
      })
      return c.json({ threadId }, 201)
    },
  )
  .get("/threads/:id/messages", async (c) => {
    const auth = c.get("auth")
    const data = await chat.getThreadWithMessages(
      c.req.param("id"),
      auth.user.id,
    )
    if (!data) return c.json({ error: "Not found" }, 404)
    return c.json(data)
  })
  .post(
    "/threads/:id/messages",
    zValidator("json", z.object({ message: z.string().min(1) })),
    async (c) => {
      const auth = c.get("auth")
      const thread = await chat.getThreadForUser(c.req.param("id"), auth.user.id)
      if (!thread) return c.json({ error: "Not found" }, 404)

      const body = c.req.valid("json")
      await chat.sendThreadMessage({
        threadId: thread.id,
        message: body.message,
      })
      return c.json({ ok: true })
    },
  )
  .post(
    "/uploads/presign",
    zValidator(
      "json",
      z.object({
        key: z.string(),
        contentType: z.string(),
      }),
    ),
    async (c) => {
      const body = c.req.valid("json")
      const url = await createUploadUrl(body.key, body.contentType)
      return c.json({ url, key: body.key })
    },
  )
  .post(
    "/billing/checkout",
    zValidator(
      "json",
      z.object({
        plan: z.enum(["starter", "pro"]),
        cycle: z.enum(["monthly", "yearly"]).default("yearly"),
      }),
    ),
    async (c) => {
      const auth = c.get("auth")
      const body = c.req.valid("json")

      let priceId: string
      try {
        priceId = getStripePriceId(body.plan, body.cycle)
      } catch (error) {
        return c.json(
          {
            error:
              error instanceof Error ? error.message : "Price not configured",
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
    },
  )
  .post("/billing/portal", async (c) => {
    const auth = c.get("auth")
    const session = await createCustomerPortalSession(auth.account.id)
    if (!session) return c.json({ error: "No customer" }, 404)
    return c.json(session)
  })
  .get(
    "/analytics/overview",
    zValidator(
      "query",
      z.object({
        profileId: z.string(),
        startDate: z.string(),
        endDate: z.string(),
      }),
    ),
    async (c) => {
      const { profileId, startDate, endDate } = c.req.valid("query")

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
          queryTinybirdEndpoint("device_breakdown", {
            ...params,
            limit: "10",
          }),
          queryTinybirdEndpoint("referrer_breakdown", {
            ...params,
            limit: "20",
          }),
        ])

      const overviewRow = overview.data?.[0] as
        | {
            total_page_views: number
            unique_visitors: number
            total_link_clicks: number
            average_ctr: number
          }
        | undefined

      return c.json({
        overview: overviewRow ?? null,
        linkClicks: (linkClicks.data ?? null) as Array<{
          link_id: string
          clicks: number
          unique_clickers: number
        }> | null,
        deviceBreakdown: (deviceBreakdown.data ?? null) as Array<{
          device: string
          views: number
          unique_visitors: number
        }> | null,
        referrerBreakdown: (referrerBreakdown.data ?? null) as Array<{
          referrer: string
          views: number
          unique_visitors: number
        }> | null,
      })
    },
  )
  .post(
    "/support",
    zValidator("json", z.object({ message: z.string().min(1) })),
    async (c) => {
      const auth = c.get("auth")
      const body = c.req.valid("json")
      await sendSupportEmail({
        fromEmail: auth.user.email ?? "unknown@inbound.click",
        message: body.message,
      })
      return c.json({ ok: true })
    },
  )
  .post(
    "/feedback",
    zValidator("json", z.object({ message: z.string().min(1) })),
    async (c) => {
      const auth = c.get("auth")
      const body = c.req.valid("json")
      await sendSupportEmail({
        fromEmail: auth.user.email ?? "unknown@inbound.click",
        message: `[Feedback]\n${body.message}`,
      })
      return c.json({ ok: true })
    },
  )
  .get("/system/users", async (c) => {
    const auth = c.get("auth")
    if (!(await accounts.isSuperUser(auth.user.id))) {
      return c.json({ error: "Forbidden" }, 403)
    }

    const users = await accounts.listSystemUsers()
    return c.json({ users })
  })
  .post(
    "/profiles/:id/links/reorder",
    zValidator(
      "json",
      z.object({
        linkIds: z.array(z.string()).min(1),
      }),
    ),
    async (c) => {
      const auth = c.get("auth")
      const body = c.req.valid("json")

      const ok = await profiles.reorderLinksForProfile({
        profileId: c.req.param("id"),
        accountId: auth.account.id,
        linkIds: body.linkIds,
      })
      if (!ok) return c.json({ error: "Not found" }, 404)
      return c.json({ ok: true })
    },
  )
  .get("/forms/:id/submissions/:submissionId/transcript", async (c) => {
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
  })
