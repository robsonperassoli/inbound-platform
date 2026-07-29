import { createFileRoute, redirect } from "@tanstack/react-router"
import { apiUrl } from "../lib/api.ts"

export const Route = createFileRoute("/$username/link/$linkId")({
  loader: async ({ params }) => {
    const response = await fetch(
      `${apiUrl()}/public/links/${params.linkId}`,
    )
    if (!response.ok) {
      throw new Error("Link not found")
    }
    const link = (await response.json()) as {
      id: string
      url: string | null
      type: string
      profileId: string
    }

    await fetch(`${apiUrl()}/public/links/${params.linkId}/click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId: "anonymous" }),
    }).catch(() => undefined)

    if (link.url) {
      throw redirect({ href: link.url })
    }

    throw redirect({ to: "/$username", params: { username: params.username } })
  },
  component: () => null,
})
