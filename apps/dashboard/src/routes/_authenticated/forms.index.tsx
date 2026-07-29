import { ChevronDown, Sparkles } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { ScrollableContainer } from "@/components/app-layout/scrollable-container"
import { CreateFormPrompt } from "@/components/forms/create-form-prompt"
import { CreateFormSheet } from "@/components/forms/create-form-sheet"
import { useSiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useForms } from "@/hooks/queries/forms"

export const Route = createFileRoute("/_authenticated/forms/")({
  component: RouteComponent,
})

function RouteComponent() {
  const headerActions = useMemo(
    () => [
      <ButtonGroup key="create-form-actions">
        <Button size="sm" onClick={() => setOpenDialog("prompt-create")}>
          <HugeiconsIcon icon={Sparkles} /> Create Form
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="!pl-2" size="sm">
              <HugeiconsIcon icon={ChevronDown} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setOpenDialog("manual-create")}>
                Create manually
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </ButtonGroup>,
    ],
    [],
  )

  useSiteHeader({ title: "Forms", actions: headerActions })

  const { data: forms, isLoading } = useForms()

  const [openDialog, setOpenDialog] = useState<
    null | "manual-create" | "prompt-create"
  >(null)

  return (
    <ScrollableContainer className="space-y-5">
      {isLoading && (
        <Card className="border-border/60 bg-muted/20">
          <CardContent className="py-10 text-sm text-muted-foreground">
            Loading forms…
          </CardContent>
        </Card>
      )}

      {!isLoading && forms?.length === 0 && (
        <Card className="border-border/60 bg-muted/20">
          <CardContent className="py-10">
            <p className="text-sm text-muted-foreground">
              No forms yet. Create one to start collecting submissions.
            </p>
          </CardContent>
        </Card>
      )}

      {forms && forms.length > 0 && (
        <Card className="!gap-0 !py-0 overflow-hidden border-border/60 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/70">
          <CardContent className="p-0">
            {forms.map((item) => (
              <div
                key={item.id}
                className="grid gap-4 border-b border-border/60 px-5 py-4 last:border-b-0 md:grid-cols-[1fr_auto] md:items-center"
              >
                <div className="min-w-0 space-y-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <h3 className="truncate text-sm font-semibold">
                      {item.title}
                    </h3>
                    <span className="rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {item.fields.length} fields
                    </span>
                  </div>

                  <p className="line-clamp-1 text-sm text-muted-foreground">
                    {item.description || "No description"}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Updated{" "}
                    {new Intl.DateTimeFormat("en-US", {
                      dateStyle: "medium",
                    }).format(item.updatedAt)}
                  </p>
                </div>

                <div className="flex gap-2 md:justify-end">
                  <Button asChild size="sm" variant="ghost">
                    <Link to="/forms/$id/settings" params={{ id: item.id }}>
                      Edit
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/forms/$id/submissions" params={{ id: item.id }}>
                      Submissions
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="text-xs text-muted-foreground">
        {forms ? `${forms.length} total forms` : ""}
      </div>

      <CreateFormSheet
        open={openDialog === "manual-create"}
        onClose={() => setOpenDialog(null)}
      />

      <CreateFormPrompt
        open={openDialog === "prompt-create"}
        onClose={() => setOpenDialog(null)}
      />
    </ScrollableContainer>
  )
}
