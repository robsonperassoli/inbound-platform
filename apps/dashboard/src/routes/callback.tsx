import { createFileRoute, redirect } from "@tanstack/react-router"
import { listProfiles } from "@/api/profiles"

/** WorkOS callback is handled by the API (`/auth/callback`) which sets the
 * session cookie and redirects here. Send new users to onboarding. */
export const Route = createFileRoute("/callback")({
  beforeLoad: async () => {
    const { profiles } = await listProfiles()
    if (profiles.length === 0) {
      throw redirect({ to: "/onboarding" })
    }
    throw redirect({ to: "/bio" })
  },
})
