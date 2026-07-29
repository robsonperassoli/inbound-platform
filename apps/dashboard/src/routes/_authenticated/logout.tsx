import { createFileRoute, redirect } from "@tanstack/react-router"
import { API_URL } from "@/lib/config"

/** Full-page redirect to the API logout endpoint so cookies clear on the API
 * origin and WorkOS can end its AuthKit session (avoids instant re-login). */
export const Route = createFileRoute("/_authenticated/logout")({
  beforeLoad: () => {
    throw redirect({ href: `${API_URL}/auth/logout` })
  },
})
