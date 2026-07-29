import { and, asc, eq } from "drizzle-orm"
import { createId } from "@inbound/shared"
import { db } from "../../db/client.ts"
import { links, profiles } from "../../db/schema.ts"

export async function getProfileById(id: string) {
  return db.query.profiles.findFirst({ where: eq(profiles.id, id) })
}

export async function getProfileByUsername(username: string) {
  return db.query.profiles.findFirst({ where: eq(profiles.username, username) })
}

export async function listProfilesByAccount(accountId: string) {
  return db.query.profiles.findMany({
    where: eq(profiles.accountId, accountId),
    orderBy: [asc(profiles.username)],
  })
}

export async function listProfilesByAccountOrderedByTitle(accountId: string) {
  return db.query.profiles.findMany({
    where: eq(profiles.accountId, accountId),
    orderBy: [asc(profiles.title)],
  })
}

export async function createProfile(input: {
  id?: string
  accountId: string
  userId: string
  username: string
  title: string
  bio?: string
  theme: string
  backgroundColor: string
  fontFamily: string
  textColor: string
  buttonShape: "square" | "rounded" | "pill"
  buttonStyle: "solid" | "outline" | "paper" | "shadow" | "3d" | "ghost"
  buttonColor: string
  buttonTextColor: string
  publishedAt?: number | null
  createdAt?: number
  updatedAt?: number
}) {
  const id = input.id ?? createId()
  const now = Date.now()
  await db.insert(profiles).values({
    id,
    accountId: input.accountId,
    userId: input.userId,
    username: input.username,
    title: input.title,
    bio: input.bio ?? "",
    theme: input.theme,
    backgroundColor: input.backgroundColor,
    fontFamily: input.fontFamily,
    textColor: input.textColor,
    buttonShape: input.buttonShape,
    buttonStyle: input.buttonStyle,
    buttonColor: input.buttonColor,
    buttonTextColor: input.buttonTextColor,
    publishedAt: input.publishedAt ?? null,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  })
  return (await getProfileById(id))!
}

export async function updateProfile(
  id: string,
  patch: {
    title?: string
    bio?: string
    theme?: string
    backgroundColor?: string
    fontFamily?: string
    textColor?: string
    buttonShape?: "square" | "rounded" | "pill"
    buttonStyle?: "solid" | "outline" | "paper" | "shadow" | "3d" | "ghost"
    buttonColor?: string
    buttonTextColor?: string
    avatarKey?: string | null
    backgroundImageKey?: string | null
    publishedAt?: number | null
  },
) {
  await db
    .update(profiles)
    .set({ ...patch, updatedAt: Date.now() })
    .where(eq(profiles.id, id))
  return getProfileById(id)
}

export async function getLinkById(id: string) {
  return db.query.links.findFirst({ where: eq(links.id, id) })
}

export async function listLinksByProfile(profileId: string) {
  return db.query.links.findMany({
    where: eq(links.profileId, profileId),
    orderBy: [asc(links.order)],
  })
}

export async function listActiveLinksByProfile(profileId: string) {
  return db.query.links.findMany({
    where: and(eq(links.profileId, profileId), eq(links.active, true)),
    orderBy: [asc(links.order)],
  })
}

export async function createLink(input: {
  id?: string
  userId: string
  profileId: string
  title: string
  type: "url" | "social" | "form"
  url?: string | null
  platform?:
    | "instagram"
    | "tiktok"
    | "x"
    | "youtube"
    | "facebook"
    | "linkedin"
    | null
  formId?: string | null
  order?: number
  active?: boolean
  createdAt?: number
}) {
  const id = input.id ?? createId()
  await db.insert(links).values({
    id,
    userId: input.userId,
    profileId: input.profileId,
    title: input.title,
    type: input.type,
    url: input.url ?? null,
    platform: input.platform ?? null,
    formId: input.formId ?? null,
    order: input.order ?? 0,
    active: input.active ?? true,
    createdAt: input.createdAt ?? Date.now(),
  })
  return (await getLinkById(id))!
}

export async function updateLink(
  id: string,
  patch: {
    title?: string
    url?: string | null
    order?: number
    active?: boolean
    platform?:
      | "instagram"
      | "tiktok"
      | "x"
      | "youtube"
      | "facebook"
      | "linkedin"
      | null
    formId?: string | null
  },
) {
  await db.update(links).set(patch).where(eq(links.id, id))
  return getLinkById(id)
}

export async function deleteLink(id: string) {
  await db.delete(links).where(eq(links.id, id))
}

export async function reorderLinks(profileId: string, linkIds: string[]) {
  await Promise.all(
    linkIds.map((linkId, index) =>
      db
        .update(links)
        .set({ order: index })
        .where(and(eq(links.id, linkId), eq(links.profileId, profileId))),
    ),
  )
}
