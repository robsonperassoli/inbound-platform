import { randomBytes } from "node:crypto"
import { createId } from "@inbound/shared"
import * as profiles from "../profiles/index.ts"
import * as repository from "./repository.ts"

const INVITATION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000

export type AuthScope = {
  user: NonNullable<Awaited<ReturnType<typeof repository.getUserById>>>
  account: NonNullable<Awaited<ReturnType<typeof repository.getAccountById>>>
  membership: NonNullable<
    Awaited<ReturnType<typeof repository.getMembershipByUserId>>
  >
}

function generateInvitationToken() {
  return randomBytes(24).toString("hex")
}

export type AuthScopeResult =
  | { ok: true; scope: AuthScope }
  | { ok: false; reason: "unauthorized" | "no_membership" | "no_account" }

export async function getAuthScope(userId: string): Promise<AuthScopeResult> {
  const user = await repository.getUserById(userId)
  if (!user) return { ok: false, reason: "unauthorized" }

  const membership = await repository.getMembershipByUserId(user.id)
  if (!membership) return { ok: false, reason: "no_membership" }

  const account = await repository.getAccountById(membership.accountId)
  if (!account) return { ok: false, reason: "no_account" }

  return { ok: true, scope: { user, account, membership } }
}

export async function ensureUserFromWorkOS(input: {
  authId: string
  email?: string | null
  name?: string | null
  profilePictureUrl?: string | null
}) {
  const existing = await repository.getUserByAuthId(input.authId)

  if (existing) {
    await repository.updateUser(existing.id, {
      email: input.email ?? existing.email,
      name: input.name ?? existing.name,
      profilePictureUrl:
        input.profilePictureUrl ?? existing.profilePictureUrl,
    })
    return existing
  }

  const userId = createId()
  const accountId = createId()

  await repository.createUser({
    id: userId,
    authId: input.authId,
    email: input.email ?? null,
    name: input.name ?? null,
    profilePictureUrl: input.profilePictureUrl ?? null,
  })

  await repository.createAccount({ id: accountId, type: "individual" })

  await repository.createMembership({
    accountId,
    userId,
    role: "owner",
    profiles: ["all"],
  })

  return repository.getUserById(userId)
}

export async function normalizeMemberPermissions(
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
  const accountProfiles = await profiles.listAccountProfileIds(accountId)
  const accountProfileIds = new Set(accountProfiles)

  for (const profileId of uniqueProfileIds) {
    if (!accountProfileIds.has(profileId)) {
      throw new Error("One or more selected pages do not belong to this team")
    }
  }

  return uniqueProfileIds
}

export async function listTeamMembers(accountId: string) {
  const members = await repository.listMembershipsByAccount(accountId)
  return Promise.all(
    members.map(async (member) => {
      const user = await repository.getUserById(member.userId)
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
}

export async function listTeamInvitations(accountId: string) {
  const rows = await repository.listPendingInvitationsByAccount(accountId)
  const result = await Promise.all(
    rows.map(async (invitation) => {
      const inviter = await repository.getUserById(invitation.invitedByUserId)
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
  return result
}

export async function createInvitation(input: {
  accountId: string
  invitedByUserId: string
  email: string
  role: "owner" | "admin" | "member"
  profiles: string[]
}) {
  const email = input.email.toLowerCase()
  const existing = await repository.findPendingInvitation(
    input.accountId,
    email,
  )
  if (existing) {
    throw new Error("An invitation is already pending for this email")
  }

  const token = generateInvitationToken()
  const expiresAt = Date.now() + INVITATION_EXPIRY_MS
  const normalizedProfiles = await normalizeMemberPermissions(
    input.accountId,
    input.role,
    input.profiles,
  )

  const invitation = await repository.createInvitation({
    accountId: input.accountId,
    token,
    email,
    role: input.role,
    profiles: normalizedProfiles,
    expiresAt,
    invitedByUserId: input.invitedByUserId,
  })

  return { invitation, token, expiresAt }
}

export async function resendInvitation(input: {
  invitationId: string
  accountId: string
  invitedByUserId: string
}) {
  const invitation = await repository.getInvitationById(input.invitationId)
  if (!invitation || invitation.accountId !== input.accountId) {
    throw new Error("Invitation not found")
  }
  if (invitation.status !== "pending") {
    throw new Error("Can only resend pending invitations")
  }

  await repository.revokeInvitation(invitation.id)

  const token = generateInvitationToken()
  const expiresAt = Date.now() + INVITATION_EXPIRY_MS
  const created = await repository.createInvitation({
    accountId: invitation.accountId,
    token,
    email: invitation.email,
    role: invitation.role,
    profiles: invitation.profiles,
    expiresAt,
    invitedByUserId: input.invitedByUserId,
  })

  return { invitation: created, token, expiresAt, email: invitation.email }
}

export async function revokeInvitation(input: {
  invitationId: string
  accountId: string
}) {
  const invitation = await repository.getInvitationById(input.invitationId)
  if (!invitation || invitation.accountId !== input.accountId) {
    throw new Error("Invitation not found")
  }
  if (invitation.status !== "pending") {
    throw new Error("Can only revoke pending invitations")
  }
  await repository.revokeInvitation(invitation.id)
}

export async function updateMemberProfiles(input: {
  membershipId: string
  accountId: string
  profiles: string[]
}) {
  const membership = await repository.getMembershipById(input.membershipId)
  if (!membership || membership.accountId !== input.accountId) {
    throw new Error("Member not found")
  }
  if (membership.role !== "member") {
    throw new Error("Only members can have restricted page permissions")
  }

  const normalizedProfiles = await normalizeMemberPermissions(
    input.accountId,
    membership.role,
    input.profiles,
  )

  await repository.updateMembershipProfiles(membership.id, normalizedProfiles)
}

export async function getInvitationPreview(token: string) {
  const invitation = await repository.getInvitationByToken(token)

  if (!invitation) {
    return {
      status: "invalid" as const,
      message: "This invitation link is invalid.",
    }
  }

  if (invitation.status !== "pending") {
    return {
      status: "invalid" as const,
      message:
        invitation.status === "accepted"
          ? "This invitation has already been accepted."
          : "This invitation is no longer available.",
    }
  }

  if (invitation.expiresAt < Date.now()) {
    return {
      status: "invalid" as const,
      message: "This invitation has expired.",
    }
  }

  const inviter = await repository.getUserById(invitation.invitedByUserId)

  return {
    status: "valid" as const,
    email: invitation.email,
    role: invitation.role,
    invitedByName: inviter?.name ?? inviter?.email ?? "Someone",
  }
}

export async function acceptInvitation(input: {
  token: string
  userId: string
}) {
  const invitation = await repository.getInvitationByToken(input.token)
  if (!invitation) {
    throw new Error("Invitation not found")
  }
  if (invitation.status !== "pending") {
    throw new Error(
      invitation.status === "accepted"
        ? "Invitation already accepted"
        : "Invitation is no longer available",
    )
  }
  if (invitation.expiresAt < Date.now()) {
    throw new Error("Invitation has expired")
  }

  const memberships = await repository.listMembershipsByUser(input.userId)
  for (const membership of memberships) {
    await repository.deleteMembership(membership.id)
  }

  await repository.createMembership({
    accountId: invitation.accountId,
    userId: input.userId,
    role: invitation.role,
    profiles: invitation.profiles,
  })

  await repository.updateAccountType(invitation.accountId, "team")
  await repository.acceptInvitation(invitation.id, input.userId)
}

export async function isSuperUser(userId: string) {
  return Boolean(await repository.getSuperUserByUserId(userId))
}

export async function listSystemUsers() {
  const [allUsers, memberships, allAccounts] = await Promise.all([
    repository.listUsers(),
    repository.listAllMemberships(),
    repository.listAccounts(),
  ])

  const membershipsByUserId = new Map(
    memberships.map((membership) => [membership.userId, membership]),
  )
  const accountsById = new Map(
    allAccounts.map((account) => [account.id, account]),
  )
  const roleOrder = { owner: 0, admin: 1, member: 2 } as const

  return allUsers
    .map((user) => {
      const membership = membershipsByUserId.get(user.id)
      if (!membership) return null
      const account = accountsById.get(membership.accountId)
      return {
        userId: user.id,
        accountId: membership.accountId,
        accountType: account?.type ?? null,
        name: user.name ?? user.email ?? "Unknown user",
        email: user.email ?? "",
        role: membership.role,
        canSetupStripe: membership.role === "owner",
      }
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => {
      const byRole = roleOrder[a.role] - roleOrder[b.role]
      if (byRole !== 0) return byRole
      const byName = a.name.localeCompare(b.name)
      if (byName !== 0) return byName
      return a.email.localeCompare(b.email)
    })
}

export async function setAccountType(
  accountId: string,
  type: "team" | "individual",
) {
  return repository.updateAccountType(accountId, type)
}

export {
  getUserById,
  getUserByEmail,
  createUser,
  createAccount,
  createMembership,
} from "./repository.ts"
