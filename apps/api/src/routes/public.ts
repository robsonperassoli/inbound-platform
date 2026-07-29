import { Hono } from "hono"
import {
  sendFormSessionMessageInputSchema,
  startFormSessionInputSchema,
} from "@inbound/shared"
import { z } from "zod"
import {
  getFormSessionMessages,
  sendFormSessionMessage,
  startFormSession,
} from "../lib/form-sessions.ts"
import { getLinkById, getPublicProfileByUsername } from "../lib/profiles.ts"
import { ingestLinkClick, ingestPageView } from "../integrations/tinybird.ts"

export const publicRoutes = new Hono()

publicRoutes.get("/profiles/:username", async (c) => {
  const username = c.req.param("username")
  const data = await getPublicProfileByUsername(username)
  if (!data) {
    return c.json({ error: "Not found" }, 404)
  }
  return c.json(data)
})

publicRoutes.get("/links/:id", async (c) => {
  const link = await getLinkById(c.req.param("id"))
  if (!link) {
    return c.json({ error: "Not found" }, 404)
  }
  return c.json(link)
})

publicRoutes.post("/links/:id/click", async (c) => {
  const link = await getLinkById(c.req.param("id"))
  if (!link) {
    return c.json({ error: "Not found" }, 404)
  }

  const body = await c.req.json().catch(() => ({}))
  await ingestLinkClick({
    profile_id: link.profileId,
    visitor_id: typeof body.visitorId === "string" ? body.visitorId : "anonymous",
    link_id: link.id,
    timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
  })

  return c.json({ url: link.url, type: link.type })
})

publicRoutes.post("/page-views", async (c) => {
  const body = z
    .object({
      profileId: z.string(),
      visitorId: z.string(),
      referrer: z.string().nullable().optional(),
      referrerName: z.string().nullable().optional(),
      device: z.string().nullable().optional(),
    })
    .parse(await c.req.json())

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

publicRoutes.post("/form-sessions", async (c) => {
  const body = startFormSessionInputSchema.parse(await c.req.json())
  const sessionId = await startFormSession(body)
  return c.json({ sessionId })
})

publicRoutes.get("/form-sessions/:sessionId/messages", async (c) => {
  const messages = await getFormSessionMessages(c.req.param("sessionId"))
  return c.json({ messages })
})

publicRoutes.post("/form-sessions/:sessionId/messages", async (c) => {
  const body = sendFormSessionMessageInputSchema.parse({
    sessionId: c.req.param("sessionId"),
    ...(await c.req.json()),
  })
  await sendFormSessionMessage(body)
  return c.json({ ok: true })
})
