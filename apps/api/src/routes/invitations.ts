import { Hono } from "hono"
import * as accounts from "../domains/accounts/index"
import { requireAuth, type AuthContext } from "../middleware/auth"

export const invitationsRoutes = new Hono<{
  Variables: {
    auth: AuthContext
  }
}>()
  .use("*", requireAuth)
  .get("/invitations/:token", async (c) => {
    const preview = await accounts.getInvitationPreview(c.req.param("token"))
    return c.json(preview)
  })
  .post("/invitations/:token/accept", async (c) => {
    const auth = c.get("auth")

    try {
      await accounts.acceptInvitation({
        token: c.req.param("token"),
        userId: auth.user.id,
      })
      return c.json({ ok: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bad request"
      if (message === "Invitation not found") {
        return c.json({ error: message }, 404)
      }
      return c.json({ error: message }, 400)
    }
  })
