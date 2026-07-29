import { ChatSpark01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link, Outlet } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { DataTable } from "@/components/data-table"
import { useSiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { useForm, useFormSubmissions } from "@/hooks/queries"
import { formatToLocalDateTime } from "@/lib/dates"

export const Route = createFileRoute("/_authenticated/forms/$id/submissions")({
  component: RouteComponent,
})

function RouteComponent() {
  useSiteHeader({ title: "Submissions", titleMode: "append" })

  const { id: formId } = Route.useParams()
  const { data: form } = useForm(formId)
  const submissions = useFormSubmissions(formId)
  const submissionRows = submissions.data ?? []

  const columns: ColumnDef<(typeof submissionRows)[number]>[] = useMemo(() => {
    if (!form) {
      return []
    }

    const actionColumn: ColumnDef<(typeof submissionRows)[number]> = {
      accessorKey: "actions",
      header: "",
      cell: ({ row }) => {
        return (
          <Button asChild size="icon-sm" variant="secondary">
            <Link
              to="/forms/$id/submissions/$submissionId/transcript"
              params={{
                id: form.id,
                submissionId: row.original.id,
              }}
            >
              <HugeiconsIcon icon={ChatSpark01Icon} />
            </Link>
          </Button>
        )
      },
    }

    const startedAt: ColumnDef<(typeof submissionRows)[number]> = {
      accessorKey: "startedAt",
      header: "Started",
      cell: ({ row }) => {
        return formatToLocalDateTime(row.original.createdAt)
      },
    }

    const completedAt: ColumnDef<(typeof submissionRows)[number]> = {
      accessorKey: "completedAt",
      header: "Completed",
      cell: ({ row }) => {
        return row.original.completedAt
          ? formatToLocalDateTime(row.original.completedAt)
          : "N/A"
      },
    }

    const dataColumns: ColumnDef<(typeof submissionRows)[number]>[] =
      form.fields.map((f) => ({
        accessorKey: f.id,
        header: f.label,
        cell: ({ row }) => {
          return row.original.values[f.id] ?? "N/A"
        },
      }))

    return [startedAt, completedAt, ...dataColumns, actionColumn]
  }, [form])

  return (
    <div>
      <DataTable columns={columns} data={submissionRows} />
      <Outlet />
    </div>
  )
}
