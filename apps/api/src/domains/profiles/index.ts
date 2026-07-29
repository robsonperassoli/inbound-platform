import { getDefaultTheme } from "@inbound/shared"
import type { PublicLink, PublicProfile } from "@inbound/shared"
import { resolveAssetUrl } from "../../integrations/storage.ts"
import * as repository from "./repository.ts"

async function withAssetUrls<T extends {
  avatarKey: string | null
  backgroundImageKey: string | null
}>(profile: T) {
  return {
    ...profile,
    avatarUrl: await resolveAssetUrl(profile.avatarKey),
    backgroundImageUrl: await resolveAssetUrl(profile.backgroundImageKey),
  }
}

export async function listAccountProfileIds(accountId: string) {
  const rows = await repository.listProfilesByAccount(accountId)
  return rows.map((p) => p.id)
}

export async function listTeamProfiles(accountId: string) {
  const rows =
    await repository.listProfilesByAccountOrderedByTitle(accountId)
  return rows.map((p) => ({
    id: p.id,
    title: p.title,
    username: p.username,
  }))
}

export async function listAccountProfiles(accountId: string) {
  const rows = await repository.listProfilesByAccount(accountId)
  return Promise.all(rows.map((p) => withAssetUrls(p)))
}

export async function isUsernameAvailable(username: string) {
  const existing = await repository.getProfileByUsername(username)
  return !existing
}

export async function createProfile(input: {
  accountId: string
  userId: string
  username: string
  title: string
  bio?: string
}) {
  const existing = await repository.getProfileByUsername(input.username)
  if (existing) {
    throw new Error("Username taken")
  }

  const theme = getDefaultTheme()
  return repository.createProfile({
    accountId: input.accountId,
    userId: input.userId,
    username: input.username,
    title: input.title,
    bio: input.bio,
    theme: theme.name,
    backgroundColor: theme.backgroundColor,
    fontFamily: theme.fontFamily,
    textColor: theme.textColor,
    buttonShape: theme.buttonShape,
    buttonStyle: theme.buttonStyle,
    buttonColor: theme.buttonColor,
    buttonTextColor: theme.buttonTextColor,
  })
}

export async function getProfileForAccount(profileId: string, accountId: string) {
  const profile = await repository.getProfileById(profileId)
  if (!profile || profile.accountId !== accountId) return null
  return profile
}

export async function getProfileWithLinks(profileId: string, accountId: string) {
  const profile = await getProfileForAccount(profileId, accountId)
  if (!profile) return null

  const profileLinks = await repository.listLinksByProfile(profile.id)
  return {
    profile: await withAssetUrls(profile),
    links: profileLinks,
  }
}

export async function updateProfileForAccount(
  profileId: string,
  accountId: string,
  patch: Parameters<typeof repository.updateProfile>[1],
) {
  const existing = await getProfileForAccount(profileId, accountId)
  if (!existing) return null
  return repository.updateProfile(existing.id, patch)
}

export async function createLinkForProfile(input: {
  profileId: string
  accountId: string
  userId: string
  title: string
  type: "url" | "social" | "form"
  url?: string
  platform?:
    | "instagram"
    | "tiktok"
    | "x"
    | "youtube"
    | "facebook"
    | "linkedin"
  formId?: string
  order?: number
  active?: boolean
}) {
  const profile = await getProfileForAccount(input.profileId, input.accountId)
  if (!profile) return null

  return repository.createLink({
    userId: input.userId,
    profileId: profile.id,
    title: input.title,
    type: input.type,
    url: input.url,
    platform: input.platform,
    formId: input.formId,
    order: input.order,
    active: input.active,
  })
}

export async function updateLinkForUser(
  linkId: string,
  userId: string,
  patch: Parameters<typeof repository.updateLink>[1],
) {
  const existing = await repository.getLinkById(linkId)
  if (!existing || existing.userId !== userId) return null
  return repository.updateLink(existing.id, patch)
}

export async function deleteLinkForUser(linkId: string, userId: string) {
  const existing = await repository.getLinkById(linkId)
  if (!existing || existing.userId !== userId) return false
  await repository.deleteLink(existing.id)
  return true
}

export async function reorderLinksForProfile(input: {
  profileId: string
  accountId: string
  linkIds: string[]
}) {
  const profile = await getProfileForAccount(input.profileId, input.accountId)
  if (!profile) return false
  await repository.reorderLinks(profile.id, input.linkIds)
  return true
}

export async function getPublicProfileByUsername(username: string) {
  const profile = await repository.getProfileByUsername(username)
  if (!profile) return null

  const profileLinks = await repository.listActiveLinksByProfile(profile.id)

  const publicProfile: PublicProfile = {
    id: profile.id,
    username: profile.username,
    title: profile.title,
    bio: profile.bio,
    avatarUrl: await resolveAssetUrl(profile.avatarKey),
    backgroundImageUrl: await resolveAssetUrl(profile.backgroundImageKey),
    publishedAt: profile.publishedAt,
    theme: profile.theme,
    backgroundColor: profile.backgroundColor,
    fontFamily: profile.fontFamily,
    textColor: profile.textColor,
    buttonShape: profile.buttonShape,
    buttonStyle: profile.buttonStyle,
    buttonColor: profile.buttonColor,
    buttonTextColor: profile.buttonTextColor,
  }

  const publicLinks: PublicLink[] = profileLinks.map((link) => ({
    id: link.id,
    title: link.title,
    order: link.order,
    active: link.active,
    type: link.type,
    formId: link.formId,
    url: link.url,
    platform: link.platform,
  }))

  return { profile: publicProfile, links: publicLinks }
}

export async function getLinkById(id: string) {
  const link = await repository.getLinkById(id)
  if (!link) return null

  return {
    id: link.id,
    title: link.title,
    order: link.order,
    active: link.active,
    type: link.type,
    formId: link.formId,
    url: link.url,
    platform: link.platform,
    profileId: link.profileId,
  }
}

export async function updateTheme(
  profileId: string,
  theme: {
    theme: string
    backgroundColor: string
    fontFamily: string
    textColor: string
    buttonShape: "square" | "rounded" | "pill"
    buttonStyle: "solid" | "outline" | "paper" | "shadow" | "3d" | "ghost"
    buttonColor: string
    buttonTextColor: string
  },
) {
  return repository.updateProfile(profileId, theme)
}

export async function createFormLink(input: {
  userId: string
  profileId: string
  title: string
  formId: string
  order: number
}) {
  return repository.createLink({
    userId: input.userId,
    profileId: input.profileId,
    title: input.title,
    type: "form",
    formId: input.formId,
    order: input.order,
    active: true,
  })
}

export async function countLinksByProfile(profileId: string) {
  const rows = await repository.listLinksByProfile(profileId)
  return rows.length
}

export {
  getProfileById,
  createProfile as insertProfile,
  createLink as insertLink,
} from "./repository.ts"
