import { zValidator } from "@hono/zod-validator"
import { Hono } from "hono"
import { z } from "zod"
import * as accounts from "../domains/accounts/index"
import * as profiles from "../domains/profiles/index"
import { sendInviteEmail } from "../integrations/resend"
import { env } from "../lib/env"
import { requireAuth, type AuthContext } from "../middleware/auth"

function requireTeamAdmin(auth: AuthContext) {
  if (auth.membership.role !== "owner" && auth.membership.role !== "admin") {
    throw new Error("Forbidden")
  }
}

const createInvitationBodySchema = z.object({
  email: z.string().email(),
  role: z.enum(["owner", "admin", "member"]),
  profiles: z.array(z.string()),
})

export const teamRoutes = new Hono<{
  Variables: {
    auth: AuthContext
  }
}>()
  .use("*", requireAuth)
  .get("/team/members", async (c) => {
    const auth = c.get("auth")
    requireTeamAdmin(auth)
    const members = await accounts.listTeamMembers(auth.account.id)
    return c.json({ members })
  })
  .get("/team/invitations", async (c) => {
    const auth = c.get("auth")
    requireTeamAdmin(auth)
    const invitations = await accounts.listTeamInvitations(auth.account.id)
    return c.json({ invitations })
  })
  .get("/team/profiles", async (c) => {
    const auth = c.get("auth")
    requireTeamAdmin(auth)
    const rows = await profiles.listTeamProfiles(auth.account.id)
    return c.json({ profiles: rows })
  })
  .post(
    "/team/invitations",
    zValidator("json", createInvitationBodySchema),
    async (c) => {
      const auth = c.get("auth")
      requireTeamAdmin(auth)
      const body = c.req.valid("json")

      try {
        const { invitation, token, expiresAt } = await accounts.createInvitation(
          {
            accountId: auth.account.id,
            invitedByUserId: auth.user.id,
            email: body.email,
            role: body.role,
            profiles: body.profiles,
          },
        )

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
    },
  )
  .post("/team/invitations/:id/resend", async (c) => {
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
  .delete("/team/invitations/:id", async (c) => {
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
  .patch(
    "/team/members/:id",
    zValidator("json", z.object({ profiles: z.array(z.string()) })),
    async (c) => {
      const auth = c.get("auth")
      requireTeamAdmin(auth)
      const body = c.req.valid("json")

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
    },
  )
