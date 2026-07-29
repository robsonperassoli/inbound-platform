type PublicProfileBase = {
  username: string
  title: string
  bio: string
  avatarUrl: string | null
}

export type PublishedPublicProfileData = {
  state: "published"
  profile: PublicProfileBase
}

export type UnpublishedPublicProfileData = {
  state: "unpublished"
  profile: PublicProfileBase
}

export type PublicProfilePageData =
  | PublishedPublicProfileData
  | UnpublishedPublicProfileData

export function buildPublicProfileHead(loaderData?: PublicProfilePageData) {
  const profile = loaderData?.profile

  if (!profile) {
    return {
      meta: [{ title: "Profile Not Found" }],
    }
  }

  const url = `https://s.uper.bio/${profile.username}`

  if (loaderData.state === "unpublished") {
    const title = `${profile.title || profile.username} | Coming Soon`
    const description = `${profile.title || profile.username} is getting this page ready. Check back soon.`

    const meta = [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { property: "og:site_name", content: "Superbio" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { rel: "canonical", href: url },
    ]

    if (profile.avatarUrl) {
      meta.push({ property: "og:image", content: profile.avatarUrl })
      meta.push({ name: "twitter:image", content: profile.avatarUrl })
    }

    return { meta }
  }

  const title = profile.title || `${profile.username}'s Profile`
  const description =
    profile.bio || `Check out ${profile.username}'s profile on Superbio`

  const meta = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "profile" },
    { property: "og:url", content: url },
    { property: "og:site_name", content: "Superbio" },
    {
      name: "twitter:card",
      content: profile.avatarUrl ? "summary_large_image" : "summary",
    },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "robots", content: "index, follow" },
    { rel: "canonical", href: url },
  ]

  if (profile.avatarUrl) {
    meta.push({ property: "og:image", content: profile.avatarUrl })
    meta.push({ name: "twitter:image", content: profile.avatarUrl })
  }

  return { meta }
}
