import { createFileRoute, Outlet } from "@tanstack/react-router"
import { AppLayout } from "@/components/app-layout"
import { PostHogUserIdentify } from "@/components/posthog-user-identity"
import { ensureAuthenticated } from "@/lib/auth"

export const Route = createFileRoute("/_authenticated")({
  loader: async ({ location }) => {
    await ensureAuthenticated(location.pathname)
  },
  component: () => (
    <>
      <PostHogUserIdentify />
      <AppLayout>
        <Outlet />
      </AppLayout>
    </>
  ),
})
