import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_authenticated/forms/$id/")({
  loader: async ({ params }) => {
    throw redirect({
      to: "/forms/$id/submissions",
      params,
    })
  },
})
