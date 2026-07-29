import {
  createFileRoute,
  Link,
  Outlet,
  useLocation,
} from "@tanstack/react-router"
import { useMemo } from "react"
import { ScrollableContainer } from "@/components/app-layout/scrollable-container"
import { useSiteHeader } from "@/components/site-header"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useForm } from "@/hooks/queries/forms"

export const Route = createFileRoute("/_authenticated/forms/$id")({
  component: RouteComponent,
  params: {
    parse: (params) => ({
      id: params.id as string,
    }),
  },
})

function RouteComponent() {
  const { id: formId } = Route.useParams()
  const { pathname } = useLocation()
  const { data: form } = useForm(formId)

  useSiteHeader({ title: form?.title ?? "Form" })

  const activeTab = useMemo(
    () => (pathname.includes("/settings") ? "settings" : "submissions"),
    [pathname],
  )

  return (
    <ScrollableContainer className="space-y-4">
      <Tabs value={activeTab} className="w-full">
        <TabsList>
          <TabsTrigger value="submissions" asChild>
            <Link
              to="/forms/$id/submissions"
              params={{ id: formId }}
              activeOptions={{ exact: true }}
              activeProps={{ className: "data-[state=active]" }}
            >
              Submissions
            </Link>
          </TabsTrigger>

          <TabsTrigger value="settings" asChild>
            <Link
              to="/forms/$id/settings"
              params={{ id: formId }}
              activeOptions={{ exact: true }}
              activeProps={{ className: "data-[state=active]" }}
            >
              Settings
            </Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Outlet />
    </ScrollableContainer>
  )
}
