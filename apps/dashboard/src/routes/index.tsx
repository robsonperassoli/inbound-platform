import { createFileRoute, redirect } from "@tanstack/react-router"
import { ApiError } from "@/api/client"
import { listProfiles } from "@/api/profiles"
import { getSession } from "@/api/session"

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    try {
      await getSession()
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        throw redirect({ to: "/signin" })
      }
      throw redirect({ to: "/signin" })
    }

    const { profiles } = await listProfiles()
    if (profiles.length === 0) {
      throw redirect({ to: "/onboarding" })
    }

    throw redirect({ to: "/bio" })
  },
})
