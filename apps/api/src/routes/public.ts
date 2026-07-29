import { zValidator } from "@hono/zod-validator"
import {
  sendFormSessionMessageInputSchema,
  startFormSessionInputSchema,
} from "@inbound/shared"
import { Hono } from "hono"
import { z } from "zod"
import * as chat from "../domains/chat/index"
import * as profiles from "../domains/profiles/index"
import { ingestLinkClick, ingestPageView } from "../integrations/tinybird"

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
    await ingestLinkClick({
      profile_id: link.profileId,
      visitor_id:
        typeof body.visitorId === "string" ? body.visitorId : "anonymous",
      link_id: link.id,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
    })

    return c.json({ url: link.url, type: link.type })
  })
  .post("/page-views", zValidator("json", pageViewBodySchema), async (c) => {
    const body = c.req.valid("json")

    await ingestPageView({
      profile_id: body.profileId,
      visitor_id: body.visitorId,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      referrer: body.referrer ?? null,
      referrer_name: body.referrerName ?? null,
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
