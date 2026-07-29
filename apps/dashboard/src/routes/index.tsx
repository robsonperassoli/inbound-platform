import { createFileRoute, redirect } from "@tanstack/react-router"
import { apiClient, ApiError } from "@/lib/api"

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    try {
      await apiClient.getSession()
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        throw redirect({ to: "/signin" })
      }
      throw redirect({ to: "/signin" })
    }

    const { profiles } = await apiClient.listProfiles()
    if (profiles.length === 0) {
      throw redirect({ to: "/onboarding" })
    }

    throw redirect({ to: "/bio" })
  },
})
