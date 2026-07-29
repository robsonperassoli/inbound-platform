import type { UserPageLink } from "@inbound/shared"
import { UserPage } from "@inbound/ui"
import { createFileRoute, notFound } from "@tanstack/react-router"
import { createMiddleware } from "@tanstack/react-start"
import { setResponseHeader } from "@tanstack/react-start/server"
import { useState } from "react"
import { BioFormChat } from "@/components/bio-form-chat"
import { UnpublishedProfilePage } from "@/components/unpublished-profile-page"
import { extractReferrerName } from "@/lib/analytics"
import { ApiError, getPublicProfile, startFormSession, trackPageView } from "@/lib/api"
import { getOrCreateVisitorId } from "@/lib/server/visitor-id"

const trackPageViewMiddleware = createMiddleware().server(
  async ({ request, pathname, next }) => {
    const { visitorId, setCookieHeader } = getOrCreateVisitorId(request)
    const userAgent = request.headers.get("user-agent") ?? ""
    const isBot = /bot|crawl|spider/i.test(userAgent)

    if (setCookieHeader) setResponseHeader("set-cookie", setCookieHeader)

    const segments = pathname.split("/").filter(Boolean)
    const username = segments[segments.length - 1]
    if (!username) return await next()

    try {
      const data = await getPublicProfile(username)

      if (!isBot && data.profile.publishedAt) {
        await trackPageView({
          profileId: data.profile.id,
          visitorId,
          referrer: request.headers.get("referer"),
          referrerName: extractReferrerName(request.headers.get("referer")),
          device: /mobile/i.test(userAgent) ? "mobile" : "desktop",
        })
      }
    } catch (error) {
      console.error("Failed to track page view", error)
    }

    return await next()
  },
)

export const Route = createFileRoute("/$username")({
  server: {
    middleware: [trackPageViewMiddleware],
  },
  loader: async ({ params }) => {
    try {
      return await getPublicProfile(params.username)
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) throw notFound()
      throw error
    }
  },
  head: ({ loaderData }) => {
    const profile = loaderData?.profile
    if (!profile) return { meta: [{ title: "Profile Not Found" }] }

    const title = profile.title || `${profile.username}'s Profile`
    const description =
      profile.bio || `Check out ${profile.username}'s profile on Superbio`
    const url = `https://s.uper.bio/${profile.username}`

    const meta = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "profile" },
      { property: "og:url", content: url },
      { property: "og:site_name", content: "Superbio" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "robots", content: "index, follow" },
    ]

    if (profile.avatarUrl) {
      meta.push({ property: "og:image", content: profile.avatarUrl })
      meta.push({ name: "twitter:image", content: profile.avatarUrl })
    }

    return { meta }
  },
  component: UsernamePage,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center p-8 text-center">
      <div>
        <h1 className="text-2xl font-semibold">Profile not found</h1>
        <p className="mt-2 text-zinc-600">This bio page does not exist.</p>
      </div>
    </div>
  ),
})

function UsernamePage() {
  const { profile, links } = Route.useLoaderData()
  const [sessionId, setSessionId] = useState<string>()
  const [busy, setBusy] = useState(false)

  if (!profile.publishedAt) {
    return <UnpublishedProfilePage username={profile.username} />
  }

  const mappedLinks: UserPageLink[] = links.map((l) => ({
    id: l.id,
    title: l.title,
    type: l.type,
    url:
      l.type === "url" || l.type === "social"
        ? `/${profile.username}/link/${l.id}`
        : (l.url ?? undefined),
    formId: l.formId ?? undefined,
    platform: l.platform ?? undefined,
  }))

  const onFormLinkClick = async (link: UserPageLink) => {
    if (!link.formId || busy || sessionId) return
    setBusy(true)
    try {
      const data = await startFormSession({
        profileId: profile.id,
        formId: link.formId,
      })
      setSessionId(data.sessionId)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <UserPage
        profile={{
          title: profile.title,
          bio: profile.bio,
          avatarUrl: profile.avatarUrl,
          backgroundImageUrl: profile.backgroundImageUrl,
          backgroundColor: profile.backgroundColor,
          fontFamily: profile.fontFamily,
          textColor: profile.textColor,
          buttonShape: profile.buttonShape,
          buttonStyle: profile.buttonStyle,
          buttonColor: profile.buttonColor,
          buttonTextColor: profile.buttonTextColor,
        }}
        links={mappedLinks}
        className="min-h-screen"
        onFormLinkClick={onFormLinkClick}
      />
      {sessionId ? <BioFormChat sessionId={sessionId} /> : null}
    </>
  )
}
