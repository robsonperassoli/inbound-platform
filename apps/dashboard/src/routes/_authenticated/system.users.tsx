import { Copy01Icon, Tick01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { ScrollableContainer } from "@/components/app-layout/scrollable-container"
import { useSiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useCopyToClipboard } from "@/hooks/copy-to-clipboard"
import { apiClient } from "@/lib/api"

export const Route = createFileRoute("/_authenticated/system/users")({
  beforeLoad: async () => {
    const session = await apiClient.getSession()
    if (!session.isSuperUser) {
      throw redirect({ to: "/bio" })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  useSiteHeader({ title: "System Users", titleMode: "append" })

  const usersQuery = useQuery({
    queryKey: ["system", "users"],
    queryFn: async () => (await apiClient.listSystemUsers()).users,
  })

  const users = usersQuery.data

  if (usersQuery.isLoading || users === undefined) {
    return <div className="text-sm text-muted-foreground">Loading users...</div>
  }

  return (
    <ScrollableContainer className="max-w-6xl">
      <div className="overflow-hidden rounded-2xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Account type</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.userId}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email || "No email"}
                  </TableCell>
                  <TableCell>
                    <AccountTypeBadge accountType={user.accountType} />
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={user.role} />
                  </TableCell>
                  <TableCell>
                    {user.canSetupStripe ? (
                      <SetupStripeDialog
                        accountId={user.accountId}
                        userId={user.userId}
                        userName={user.name}
                      />
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </ScrollableContainer>
  )
}

function AccountTypeBadge({
  accountType,
}: {
  accountType: "team" | "individual" | null
}) {
  if (accountType === null) {
    return <Badge variant="outline">Unknown</Badge>
  }

  return (
    <Badge
      className="capitalize"
      variant={accountType === "team" ? "default" : "secondary"}
    >
      {accountType}
    </Badge>
  )
}

function RoleBadge({ role }: { role: "owner" | "admin" | "member" | "none" }) {
  if (role === "none") {
    return <Badge variant="outline">No account</Badge>
  }

  const variant =
    role === "owner" ? "default" : role === "admin" ? "secondary" : "outline"

  return (
    <Badge className="capitalize" variant={variant}>
      {role}
    </Badge>
  )
}

function SetupStripeDialog({
  accountId,
  userId,
  userName,
}: {
  accountId: string | null
  userId: string
  userName: string
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Setup stripe
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Setup Stripe</DialogTitle>
          <DialogDescription>
            Copy these values to create a team subscription for {userName}.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <CopyField
            label="orgId"
            value={accountId ?? ""}
            fallback="No account assigned"
          />
          <CopyField label="userId" value={userId} />
          <CopyField label="planType" value="teams" />
        </FieldGroup>

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  )
}

function CopyField({
  fallback = "Unavailable",
  label,
  value,
}: {
  fallback?: string
  label: string
  value: string
}) {
  const { copied, copyToClipboard } = useCopyToClipboard()
  const canCopy = value.length > 0
  const displayValue = canCopy ? value : fallback

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          className="font-mono text-xs"
          readOnly
          value={displayValue}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            aria-label={`Copy ${label}`}
            disabled={!canCopy}
            size="icon-xs"
            title={`Copy ${label}`}
            onClick={() => {
              if (!canCopy) {
                return
              }

              void copyToClipboard(value)
            }}
          >
            <HugeiconsIcon icon={copied ? Tick01Icon : Copy01Icon} />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {!canCopy && <FieldDescription>{fallback}</FieldDescription>}
    </Field>
  )
}
