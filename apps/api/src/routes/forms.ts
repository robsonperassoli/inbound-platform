import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { z } from "zod"
import * as chat from "../domains/chat/index"
import * as forms from "../domains/forms/index"
import { requireAuth } from "../middleware/auth"
import type { AuthContext } from "../middleware/auth"

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

export const formsRoutes = new Hono<{
  Variables: {
    auth: AuthContext
  }
}>()
  .use("*", requireAuth)
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
