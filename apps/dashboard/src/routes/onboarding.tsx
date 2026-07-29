import { createFileRoute, redirect } from "@tanstack/react-router"
import { OnboardingPage } from "@/components/onboarding-page"
import { ensureAuthenticated } from "@/lib/auth"
import { apiClient } from "@/lib/api"

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  loader: async ({ location }) => {
    await ensureAuthenticated(location.pathname)

    const [{ profiles }, session] = await Promise.all([
      apiClient.listProfiles(),
      apiClient.getSession(),
    ])

    if (profiles.length > 0) {
      throw redirect({ to: "/bio" })
    }

    const greetingName =
      session.user.name?.split(" ")[0] ||
      session.user.email?.split("@")[0] ||
      "there"

    return {
      draft: {
        title: session.user.name ?? "",
        username: "",
        bio: "",
      },
      greetingName,
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { draft, greetingName } = Route.useLoaderData()

  return <OnboardingPage draft={draft} greetingName={greetingName} />
}
