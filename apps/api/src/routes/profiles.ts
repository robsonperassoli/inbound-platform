import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { z } from "zod"
import * as profiles from "../domains/profiles/index"
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

export const profilesRoutes = new Hono<{
  Variables: {
    auth: AuthContext
  }
}>()
  .use("*", requireAuth)
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
