import { Outlet, createFileRoute } from "@tanstack/react-router"


export const Route = createFileRoute("/_authenticated/bio/appearance")({
  component: Outlet,
})
