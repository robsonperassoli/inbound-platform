import { Hono } from "hono"
import { and, asc, eq } from "drizzle-orm"
import { createId } from "@inbound/shared"
import { randomBytes } from "node:crypto"
import { z } from "zod"
import { db } from "../db/client.ts"
import {
  accountMembers,
  accounts,
  invitations,
  profiles,
  users,
} from "../db/schema.ts"
import { sendInviteEmail } from "../integrations/resend.ts"
import { env } from "../lib/env.ts"
import { requireAuth, type AuthContext } from "../middleware/auth.ts"

export const teamRoutes = new Hono<{
  Variables: {
    auth: AuthContext
  }
}>()

teamRoutes.use("*", requireAuth)

const INVITATION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000

function requireTeamAdmin(auth: AuthContext) {
  if (auth.membership.role !== "owner" && auth.membership.role !== "admin") {
    throw new Error("Forbidden")
  }
}

function generateInvitationToken() {
  return randomBytes(24).toString("hex")
}

async function normalizeMemberPermissions(
  accountId: string,
  role: "owner" | "admin" | "member",
  profilesInput: string[],
): Promise<string[]> {
  if (role !== "member") {
    return ["all"]
  }

  if (profilesInput.length === 1 && profilesInput[0] === "all") {
    return ["all"]
  }

  if (profilesInput.length === 0 || profilesInput.includes("all")) {
    throw new Error("Choose all pages or at least one selected page")
  }

  const uniqueProfileIds = [...new Set(profilesInput)]
  const accountProfiles = await db.query.profiles.findMany({
    where: eq(profiles.accountId, accountId),
  })
  const accountProfileIds = new Set(accountProfiles.map((p) => p.id))

  for (const profileId of uniqueProfileIds) {
    if (!accountProfileIds.has(profileId)) {
      throw new Error("One or more selected pages do not belong to this team")
    }
  }

  return uniqueProfileIds
}

teamRoutes.get("/team/members", async (c) => {
  const auth = c.get("auth")
  requireTeamAdmin(auth)

  const members = await db.query.accountMembers.findMany({
    where: eq(accountMembers.accountId, auth.account.id),
    orderBy: [asc(accountMembers.joinedAt)],
  })

  const result = await Promise.all(
    members.map(async (member) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, member.userId),
      })
      return {
        membershipId: member.id,
        userId: member.userId,
        email: user?.email ?? "",
        name: user?.name ?? user?.email ?? "Unknown",
        role: member.role,
        profiles: member.profiles,
        joinedAt: member.joinedAt,
      }
    }),
  )

  return c.json({ members: result })
})

teamRoutes.get("/team/invitations", async (c) => {
  const auth = c.get("auth")
  requireTeamAdmin(auth)

  const rows = await db.query.invitations.findMany({
    where: and(
      eq(invitations.accountId, auth.account.id),
      eq(invitations.status, "pending"),
    ),
  })

  const result = await Promise.all(
    rows.map(async (invitation) => {
      const inviter = await db.query.users.findFirst({
        where: eq(users.id, invitation.invitedByUserId),
      })
      return {
        invitationId: invitation.id,
        email: invitation.email,
        role: invitation.role,
        profiles: invitation.profiles,
        expiresAt: invitation.expiresAt,
        invitedByName: inviter?.name ?? inviter?.email ?? "Someone",
      }
    }),
  )

  result.sort((a, b) => b.expiresAt - a.expiresAt)
  return c.json({ invitations: result })
})

teamRoutes.get("/team/profiles", async (c) => {
  const auth = c.get("auth")
  requireTeamAdmin(auth)

  const rows = await db.query.profiles.findMany({
    where: eq(profiles.accountId, auth.account.id),
    orderBy: [asc(profiles.title)],
  })

  return c.json({
    profiles: rows.map((p) => ({
      id: p.id,
      title: p.title,
      username: p.username,
    })),
  })
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

  const email = body.email.toLowerCase()
  const existing = await db.query.invitations.findFirst({
    where: and(
      eq(invitations.accountId, auth.account.id),
      eq(invitations.email, email),
      eq(invitations.status, "pending"),
    ),
  })
  if (existing) {
    return c.json({ error: "An invitation is already pending for this email" }, 400)
  }

  const token = generateInvitationToken()
  const expiresAt = Date.now() + INVITATION_EXPIRY_MS
  const normalizedProfiles = await normalizeMemberPermissions(
    auth.account.id,
    body.role,
    body.profiles,
  )

  const invitationId = createId()
  await db.insert(invitations).values({
    id: invitationId,
    accountId: auth.account.id,
    token,
    email,
    role: body.role,
    profiles: normalizedProfiles,
    status: "pending",
    expiresAt,
    invitedByUserId: auth.user.id,
  })

  await sendInviteEmail({
    to: email,
    inviterName: auth.user.name,
    inviteUrl: `${env.DASHBOARD_URL}/invites/${token}`,
  })

  return c.json({ invitationId, token, expiresAt })
})

teamRoutes.post("/team/invitations/:id/resend", async (c) => {
  const auth = c.get("auth")
  requireTeamAdmin(auth)
  const invitationId = c.req.param("id")

  const invitation = await db.query.invitations.findFirst({
    where: eq(invitations.id, invitationId),
  })
  if (!invitation || invitation.accountId !== auth.account.id) {
    return c.json({ error: "Invitation not found" }, 404)
  }
  if (invitation.status !== "pending") {
    return c.json({ error: "Can only resend pending invitations" }, 400)
  }

  await db
    .update(invitations)
    .set({ status: "revoked", revokedAt: Date.now() })
    .where(eq(invitations.id, invitation.id))

  const token = generateInvitationToken()
  const expiresAt = Date.now() + INVITATION_EXPIRY_MS
  const newId = createId()

  await db.insert(invitations).values({
    id: newId,
    accountId: invitation.accountId,
    token,
    email: invitation.email,
    role: invitation.role,
    profiles: invitation.profiles,
    status: "pending",
    expiresAt,
    invitedByUserId: auth.user.id,
  })

  await sendInviteEmail({
    to: invitation.email,
    inviterName: auth.user.name,
    inviteUrl: `${env.DASHBOARD_URL}/invites/${token}`,
  })

  return c.json({ invitationId: newId, token, expiresAt })
})

teamRoutes.delete("/team/invitations/:id", async (c) => {
  const auth = c.get("auth")
  requireTeamAdmin(auth)
  const invitationId = c.req.param("id")

  const invitation = await db.query.invitations.findFirst({
    where: eq(invitations.id, invitationId),
  })
  if (!invitation || invitation.accountId !== auth.account.id) {
    return c.json({ error: "Invitation not found" }, 404)
  }
  if (invitation.status !== "pending") {
    return c.json({ error: "Can only revoke pending invitations" }, 400)
  }

  await db
    .update(invitations)
    .set({ status: "revoked", revokedAt: Date.now() })
    .where(eq(invitations.id, invitation.id))

  return c.json({ ok: true })
})

teamRoutes.patch("/team/members/:id", async (c) => {
  const auth = c.get("auth")
  requireTeamAdmin(auth)
  const membershipId = c.req.param("id")
  const body = z.object({ profiles: z.array(z.string()) }).parse(await c.req.json())

  const membership = await db.query.accountMembers.findFirst({
    where: eq(accountMembers.id, membershipId),
  })
  if (!membership || membership.accountId !== auth.account.id) {
    return c.json({ error: "Member not found" }, 404)
  }
  if (membership.role !== "member") {
    return c.json(
      { error: "Only members can have restricted page permissions" },
      400,
    )
  }

  const normalizedProfiles = await normalizeMemberPermissions(
    auth.account.id,
    membership.role,
    body.profiles,
  )

  await db
    .update(accountMembers)
    .set({ profiles: normalizedProfiles })
    .where(eq(accountMembers.id, membership.id))

  return c.json({ ok: true })
})

teamRoutes.get("/invitations/:token", async (c) => {
  const auth = c.get("auth")
  const token = c.req.param("token")

  const invitation = await db.query.invitations.findFirst({
    where: eq(invitations.token, token),
  })

  if (!invitation) {
    return c.json({
      status: "invalid" as const,
      message: "This invitation link is invalid.",
    })
  }

  if (invitation.status !== "pending") {
    return c.json({
      status: "invalid" as const,
      message:
        invitation.status === "accepted"
          ? "This invitation has already been accepted."
          : "This invitation is no longer available.",
    })
  }

  if (invitation.expiresAt < Date.now()) {
    return c.json({
      status: "invalid" as const,
      message: "This invitation has expired.",
    })
  }

  const inviter = await db.query.users.findFirst({
    where: eq(users.id, invitation.invitedByUserId),
  })

  // auth is required by middleware; keep reference so unused-lint stays clean
  void auth

  return c.json({
    status: "valid" as const,
    email: invitation.email,
    role: invitation.role,
    invitedByName: inviter?.name ?? inviter?.email ?? "Someone",
  })
})

teamRoutes.post("/invitations/:token/accept", async (c) => {
  const auth = c.get("auth")
  const token = c.req.param("token")

  const invitation = await db.query.invitations.findFirst({
    where: eq(invitations.token, token),
  })
  if (!invitation) {
    return c.json({ error: "Invitation not found" }, 404)
  }
  if (invitation.status !== "pending") {
    return c.json(
      {
        error:
          invitation.status === "accepted"
            ? "Invitation already accepted"
            : "Invitation is no longer available",
      },
      400,
    )
  }
  if (invitation.expiresAt < Date.now()) {
    return c.json({ error: "Invitation has expired" }, 400)
  }

  const memberships = await db.query.accountMembers.findMany({
    where: eq(accountMembers.userId, auth.user.id),
  })
  for (const membership of memberships) {
    await db.delete(accountMembers).where(eq(accountMembers.id, membership.id))
  }

  await db.insert(accountMembers).values({
    id: createId(),
    accountId: invitation.accountId,
    userId: auth.user.id,
    role: invitation.role,
    profiles: invitation.profiles,
    joinedAt: Date.now(),
  })

  await db
    .update(accounts)
    .set({ type: "team" })
    .where(eq(accounts.id, invitation.accountId))

  await db
    .update(invitations)
    .set({
      status: "accepted",
      acceptedByUserId: auth.user.id,
      acceptedAt: Date.now(),
    })
    .where(eq(invitations.id, invitation.id))

  return c.json({ ok: true })
})
