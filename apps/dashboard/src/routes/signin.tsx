import { createFileRoute, redirect } from "@tanstack/react-router"
import { getWorkOsLoginUrl } from "@/lib/auth"

export const Route = createFileRoute("/signin")({
  validateSearch: (search: Record<string, unknown>) => ({
    returnPathname:
      typeof search.returnPathname === "string" ? search.returnPathname : "/bio",
    workos: typeof search.workos === "string" ? search.workos : undefined,
  }),
  beforeLoad: ({ search }) => {
    if (search.workos === "unconfigured") {
      return
    }

    throw redirect({ href: getWorkOsLoginUrl() })
  },
  component: SignInUnconfiguredPage,
})

function SignInUnconfiguredPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-background p-6">
      <div className="w-full max-w-md space-y-2 rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight">
          WorkOS is not configured
        </h1>
        <p className="text-sm text-muted-foreground">
          Set WORKOS_API_KEY and WORKOS_CLIENT_ID in the API environment, then
          try again.
        </p>
      </div>
    </div>
  )
}
