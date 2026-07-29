import { createFileRoute, redirect } from "@tanstack/react-router"
import { getPublicLink, trackLinkClick } from "@/lib/api"

export const Route = createFileRoute("/$username/link/$linkId")({
  loader: async ({ params }) => {
    const link = await getPublicLink(params.linkId)

    await trackLinkClick(params.linkId).catch(() => undefined)

    if (link.url) {
      throw redirect({ href: link.url })
    }

    throw redirect({ to: "/$username", params: { username: params.username } })
  },
  component: () => null,
})
