import { Hono } from "hono"
import { z } from "zod"
import * as accounts from "../domains/accounts/index.ts"
import * as profiles from "../domains/profiles/index.ts"
import { sendInviteEmail } from "../integrations/resend.ts"
import { env } from "../lib/env.ts"
import { requireAuth, type AuthContext } from "../middleware/auth.ts"

export const teamRoutes = new Hono<{
  Variables: {
    auth: AuthContext
  }
}>()

teamRoutes.use("*", requireAuth)

function requireTeamAdmin(auth: AuthContext) {
  if (auth.membership.role !== "owner" && auth.membership.role !== "admin") {
    throw new Error("Forbidden")
  }
}

teamRoutes.get("/team/members", async (c) => {
  const auth = c.get("auth")
  requireTeamAdmin(auth)
  const members = await accounts.listTeamMembers(auth.account.id)
  return c.json({ members })
})

teamRoutes.get("/team/invitations", async (c) => {
  const auth = c.get("auth")
  requireTeamAdmin(auth)
  const invitations = await accounts.listTeamInvitations(auth.account.id)
  return c.json({ invitations })
})

teamRoutes.get("/team/profiles", async (c) => {
  const auth = c.get("auth")
  requireTeamAdmin(auth)
  const rows = await profiles.listTeamProfiles(auth.account.id)
  return c.json({ profiles: rows })
})

teamRoutes.post("/team/invitations", async (c) => {
  const auth = c.get("auth")
  requireTeamAdmin(auth)

  const body = z
    .object({
      email: z.string().email(),
      role: z.enum(["owner", "admin", "member"]),
      profiles: z.array(z.string()),
    })
    .parse(await c.req.json())

  try {
    const { invitation, token, expiresAt } = await accounts.createInvitation({
      accountId: auth.account.id,
      invitedByUserId: auth.user.id,
      email: body.email,
      role: body.role,
      profiles: body.profiles,
    })

    await sendInviteEmail({
      to: invitation.email,
      inviterName: auth.user.name,
      inviteUrl: `${env.DASHBOARD_URL}/invites/${token}`,
    })

    return c.json({ invitationId: invitation.id, token, expiresAt })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bad request"
    if (message.includes("already pending")) {
      return c.json({ error: message }, 400)
    }
    throw error
  }
})

teamRoutes.post("/team/invitations/:id/resend", async (c) => {
  const auth = c.get("auth")
  requireTeamAdmin(auth)

  try {
    const { invitation, token, expiresAt, email } =
      await accounts.resendInvitation({
        invitationId: c.req.param("id"),
        accountId: auth.account.id,
        invitedByUserId: auth.user.id,
      })

    await sendInviteEmail({
      to: email,
      inviterName: auth.user.name,
      inviteUrl: `${env.DASHBOARD_URL}/invites/${token}`,
    })

    return c.json({ invitationId: invitation.id, token, expiresAt })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bad request"
    if (message === "Invitation not found") {
      return c.json({ error: message }, 404)
    }
    return c.json({ error: message }, 400)
  }
})

teamRoutes.delete("/team/invitations/:id", async (c) => {
  const auth = c.get("auth")
  requireTeamAdmin(auth)

  try {
    await accounts.revokeInvitation({
      invitationId: c.req.param("id"),
      accountId: auth.account.id,
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

teamRoutes.patch("/team/members/:id", async (c) => {
  const auth = c.get("auth")
  requireTeamAdmin(auth)
  const body = z.object({ profiles: z.array(z.string()) }).parse(await c.req.json())

  try {
    await accounts.updateMemberProfiles({
      membershipId: c.req.param("id"),
      accountId: auth.account.id,
      profiles: body.profiles,
    })
    return c.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bad request"
    if (message === "Member not found") {
      return c.json({ error: message }, 404)
    }
    return c.json({ error: message }, 400)
  }
})

teamRoutes.get("/invitations/:token", async (c) => {
  const preview = await accounts.getInvitationPreview(c.req.param("token"))
  return c.json(preview)
})

teamRoutes.post("/invitations/:token/accept", async (c) => {
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
