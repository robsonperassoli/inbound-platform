import { and, asc, eq } from "drizzle-orm"
import type { PublicLink, PublicProfile } from "@inbound/shared"
import { db } from "../db/client.ts"
import { links, profiles } from "../db/schema.ts"
import { resolveAssetUrl } from "../integrations/storage.ts"

export async function getPublicProfileByUsername(username: string) {
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.username, username),
  })

  if (!profile) return null

  const profileLinks = await db.query.links.findMany({
    where: and(eq(links.profileId, profile.id), eq(links.active, true)),
    orderBy: [asc(links.order)],
  })

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
  const link = await db.query.links.findFirst({
    where: eq(links.id, id),
  })
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
