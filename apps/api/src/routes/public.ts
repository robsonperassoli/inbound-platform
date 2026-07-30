import { zValidator } from "@hono/zod-validator"
import {
  sendFormSessionMessageInputSchema,
  startFormSessionInputSchema,
} from "@inbound/shared"
import { Hono } from "hono"
import { z } from "zod"
import * as analytics from "../domains/analytics/index"
import * as chat from "../domains/chat/index"
import * as profiles from "../domains/profiles/index"

const pageViewBodySchema = z.object({
  profileId: z.string(),
  visitorId: z.string(),
  referrer: z.string().nullable().optional(),
  referrerName: z.string().nullable().optional(),
  device: z.string().nullable().optional(),
})

const sendFormSessionMessageBodySchema = sendFormSessionMessageInputSchema.omit(
  {
    sessionId: true,
  },
)

export const publicRoutes = new Hono()
  .get("/profiles/:username", async (c) => {
    const username = c.req.param("username")
    const data = await profiles.getPublicProfileByUsername(username)
    if (!data) {
      return c.json({ error: "Not found" }, 404)
    }
    return c.json(data)
  })
  .get("/links/:id", async (c) => {
    const link = await profiles.getLinkById(c.req.param("id"))
    if (!link) {
      return c.json({ error: "Not found" }, 404)
    }
    return c.json(link)
  })
  .post("/links/:id/click", async (c) => {
    const link = await profiles.getLinkById(c.req.param("id"))
    if (!link) {
      return c.json({ error: "Not found" }, 404)
    }

    const body = await c.req.json().catch(() => ({}))
    await analytics.recordLinkClick({
      profileId: link.profileId,
      visitorId:
        typeof body.visitorId === "string" ? body.visitorId : "anonymous",
      linkId: link.id,
    })

    return c.json({ url: link.url, type: link.type })
  })
  .post("/page-views", zValidator("json", pageViewBodySchema), async (c) => {
    const body = c.req.valid("json")

    await analytics.recordPageView({
      profileId: body.profileId,
      visitorId: body.visitorId,
      referrer: body.referrer ?? null,
      referrerName: body.referrerName ?? null,
      device: body.device ?? null,
    })

    return c.json({ ok: true })
  })
  .post(
    "/form-sessions",
    zValidator("json", startFormSessionInputSchema),
    async (c) => {
      const body = c.req.valid("json")
      const sessionId = await chat.startFormSession(body)
      return c.json({ sessionId })
    },
  )
  .get("/form-sessions/:sessionId/messages", async (c) => {
    const messages = await chat.getFormSessionMessages(c.req.param("sessionId"))
    return c.json({ messages })
  })
  .post(
    "/form-sessions/:sessionId/messages",
    zValidator("json", sendFormSessionMessageBodySchema),
    async (c) => {
      const body = c.req.valid("json")
      await chat.sendFormSessionMessage({
        sessionId: c.req.param("sessionId"),
        message: body.message,
      })
      return c.json({ ok: true })
    },
  )
