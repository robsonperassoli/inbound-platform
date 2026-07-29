import { and, asc, eq } from "drizzle-orm"
import { createId } from "@inbound/shared"
import { db } from "../../db/client.ts"
import {
  accountMembers,
  accounts,
  invitations,
  superUsers,
  users,
} from "../../db/schema.ts"

export async function getUserById(id: string) {
  return db.query.users.findFirst({ where: eq(users.id, id) })
}

export async function getUserByAuthId(authId: string) {
  return db.query.users.findFirst({ where: eq(users.authId, authId) })
}

export async function getUserByEmail(email: string) {
  return db.query.users.findFirst({ where: eq(users.email, email) })
}

export async function listUsers() {
  return db.query.users.findMany()
}

export async function createUser(input: {
  id?: string
  authId?: string | null
  email?: string | null
  name?: string | null
  profilePictureUrl?: string | null
}) {
  const id = input.id ?? createId()
  await db.insert(users).values({
    id,
    authId: input.authId ?? null,
    email: input.email ?? null,
    name: input.name ?? null,
    profilePictureUrl: input.profilePictureUrl ?? null,
  })
  return (await getUserById(id))!
}

export async function updateUser(
  id: string,
  patch: {
    email?: string | null
    name?: string | null
    profilePictureUrl?: string | null
  },
) {
  await db.update(users).set(patch).where(eq(users.id, id))
  return getUserById(id)
}

export async function getAccountById(id: string) {
  return db.query.accounts.findFirst({ where: eq(accounts.id, id) })
}

export async function listAccounts() {
  return db.query.accounts.findMany()
}

export async function createAccount(input: {
  id?: string
  type: "team" | "individual"
}) {
  const id = input.id ?? createId()
  await db.insert(accounts).values({ id, type: input.type })
  return (await getAccountById(id))!
}

export async function updateAccountType(
  id: string,
  type: "team" | "individual",
) {
  await db.update(accounts).set({ type }).where(eq(accounts.id, id))
  return getAccountById(id)
}

export async function getMembershipById(id: string) {
  return db.query.accountMembers.findFirst({
    where: eq(accountMembers.id, id),
  })
}

export async function getMembershipByUserId(userId: string) {
  return db.query.accountMembers.findFirst({
    where: eq(accountMembers.userId, userId),
  })
}

export async function listMembershipsByAccount(accountId: string) {
  return db.query.accountMembers.findMany({
    where: eq(accountMembers.accountId, accountId),
    orderBy: [asc(accountMembers.joinedAt)],
  })
}

export async function listMembershipsByUser(userId: string) {
  return db.query.accountMembers.findMany({
    where: eq(accountMembers.userId, userId),
  })
}

export async function listAllMemberships() {
  return db.query.accountMembers.findMany()
}

export async function createMembership(input: {
  id?: string
  accountId: string
  userId: string
  role: "owner" | "admin" | "member"
  profiles: string[]
  joinedAt?: number
}) {
  const id = input.id ?? createId()
  await db.insert(accountMembers).values({
    id,
    accountId: input.accountId,
    userId: input.userId,
    role: input.role,
    profiles: input.profiles,
    joinedAt: input.joinedAt ?? Date.now(),
  })
  return (await getMembershipById(id))!
}

export async function updateMembershipProfiles(
  id: string,
  profiles: string[],
) {
  await db
    .update(accountMembers)
    .set({ profiles })
    .where(eq(accountMembers.id, id))
  return getMembershipById(id)
}

export async function deleteMembership(id: string) {
  await db.delete(accountMembers).where(eq(accountMembers.id, id))
}

export async function getInvitationById(id: string) {
  return db.query.invitations.findFirst({ where: eq(invitations.id, id) })
}

export async function getInvitationByToken(token: string) {
  return db.query.invitations.findFirst({ where: eq(invitations.token, token) })
}

export async function findPendingInvitation(accountId: string, email: string) {
  return db.query.invitations.findFirst({
    where: and(
      eq(invitations.accountId, accountId),
      eq(invitations.email, email),
      eq(invitations.status, "pending"),
    ),
  })
}

export async function listPendingInvitationsByAccount(accountId: string) {
  return db.query.invitations.findMany({
    where: and(
      eq(invitations.accountId, accountId),
      eq(invitations.status, "pending"),
    ),
  })
}

export async function createInvitation(input: {
  id?: string
  accountId: string
  token: string
  email: string
  role: "owner" | "admin" | "member"
  profiles: string[]
  expiresAt: number
  invitedByUserId: string
}) {
  const id = input.id ?? createId()
  await db.insert(invitations).values({
    id,
    accountId: input.accountId,
    token: input.token,
    email: input.email,
    role: input.role,
    profiles: input.profiles,
    status: "pending",
    expiresAt: input.expiresAt,
    invitedByUserId: input.invitedByUserId,
  })
  return (await getInvitationById(id))!
}

export async function revokeInvitation(id: string) {
  await db
    .update(invitations)
    .set({ status: "revoked", revokedAt: Date.now() })
    .where(eq(invitations.id, id))
  return getInvitationById(id)
}

export async function acceptInvitation(
  id: string,
  acceptedByUserId: string,
) {
  await db
    .update(invitations)
    .set({
      status: "accepted",
      acceptedByUserId,
      acceptedAt: Date.now(),
    })
    .where(eq(invitations.id, id))
  return getInvitationById(id)
}

export async function getSuperUserByUserId(userId: string) {
  return db.query.superUsers.findFirst({
    where: eq(superUsers.userId, userId),
  })
}
