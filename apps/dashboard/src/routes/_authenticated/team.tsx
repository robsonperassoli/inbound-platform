import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api"
import {
  MoreHorizontal,
  Refresh01Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useForm } from "@tanstack/react-form"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import z from "zod"
import { ScrollableContainer } from "@/components/app-layout/scrollable-container"
import { useSiteHeader } from "@/components/site-header"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSession } from "@/hooks/use-session"
import { getInitials } from "@/lib/names"

export const Route = createFileRoute("/_authenticated/team")({
  component: RouteComponent,
})

type TeamProfiles = Array<"all" | (string & {})>

type ProfileOption = {
  id: string
  title: string
  username: string
}

type Member = {
  membershipId: string
  userId: string
  email: string
  name: string
  role: "owner" | "admin" | "member"
  profiles: TeamProfiles
  joinedAt: number
}

type Invitation = {
  invitationId: string
  email: string
  role: "owner" | "admin" | "member"
  profiles: TeamProfiles
  expiresAt: number
  invitedByName: string
}

type TeamMember = {
  id: string
  type: "member"
  email: string
  name: string
  role: "owner" | "admin" | "member"
  date: number
  member: Member
}

type TeamInvitation = {
  id: string
  type: "invitation"
  email: string
  name: string
  role: "owner" | "admin" | "member"
  date: number
  invitation: Invitation
}

type TeamRow = TeamMember | TeamInvitation

function addSelectedPagesValidation(
  profiles: string[],
  ctx: z.core.$RefinementCtx<unknown>,
) {
  if (profiles.length === 0) {
    ctx.addIssue({
      code: "custom",
      message: "Select at least one page",
      input: profiles,
    })
  }

  if (profiles.includes("all") && profiles.length > 1) {
    ctx.addIssue({
      code: "custom",
      message: "Choose all pages or selected pages",
      input: profiles,
    })
  }
}

const inviteSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    role: z.enum(["admin", "member"]),
    profiles: z.array(z.string()),
  })
  .superRefine((value, ctx) => {
    if (value.role === "member") {
      addSelectedPagesValidation(value.profiles, ctx)
    }
  })

const memberPermissionsSchema = z.object({
  profiles: z.array(z.string()).superRefine(addSelectedPagesValidation),
})

function RouteComponent() {
  useSiteHeader({ title: "Team", titleMode: "append" })

  const session = useSession()
  const isReadOnly = session?.role === "member"
  const membersQuery = useQuery({
    queryKey: ["team", "members"],
    enabled: Boolean(session) && !isReadOnly,
    queryFn: async () => (await apiClient.listTeamMembers()).members,
  })
  const invitationsQuery = useQuery({
    queryKey: ["team", "invitations"],
    enabled: Boolean(session) && !isReadOnly,
    queryFn: async () => (await apiClient.listTeamInvitations()).invitations,
  })
  const profileOptionsQuery = useQuery({
    queryKey: ["team", "profiles"],
    enabled: Boolean(session) && !isReadOnly,
    queryFn: async () => (await apiClient.listTeamProfiles()).profiles,
  })

  if (
    session === undefined ||
    (!isReadOnly &&
      (membersQuery.isLoading ||
        invitationsQuery.isLoading ||
        profileOptionsQuery.isLoading))
  ) {
    return <div className="text-sm text-muted-foreground">Loading team...</div>
  }

  if (isReadOnly) {
    return (
      <ScrollableContainer className="max-w-3xl">
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            You do not have access to team management.
          </CardContent>
        </Card>
      </ScrollableContainer>
    )
  }

  const teamMembers = membersQuery.data ?? []
  const pendingInvitations = invitationsQuery.data ?? []
  const manageableProfileOptions = profileOptionsQuery.data ?? []

  const rows: TeamRow[] = [
    ...teamMembers.map(
      (member): TeamMember => ({
        id: member.membershipId,
        type: "member",
        email: member.email,
        name: member.name,
        role: member.role,
        date: member.joinedAt,
        member,
      }),
    ),
    ...pendingInvitations.map(
      (invitation): TeamInvitation => ({
        id: invitation.invitationId,
        type: "invitation",
        email: invitation.email,
        name: invitation.email,
        role: invitation.role,
        date: invitation.expiresAt,
        invitation,
      }),
    ),
  ].sort((a, b) => {
    if (a.type === "member" && b.type === "invitation") return -1
    if (a.type === "invitation" && b.type === "member") return 1
    if (a.type === "member") {
      return a.date - b.date
    }
    return b.date - a.date
  })

  return (
    <ScrollableContainer className="max-w-5xl">
      <TeamCard profileOptions={manageableProfileOptions} rows={rows} />
    </ScrollableContainer>
  )
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatExpiresAt(timestamp: number) {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return "Expired"
  }
  if (diffDays === 0) {
    return "Expires today"
  }
  if (diffDays === 1) {
    return "Expires tomorrow"
  }
  return `Expires in ${diffDays} days`
}

function isAllPages(profiles: TeamProfiles) {
  return profiles.length === 1 && profiles[0] === "all"
}

function getSelectedProfileIds(profiles: TeamProfiles) {
  return profiles.filter(
    (profile): profile is string => profile !== "all",
  )
}

function toggleSelectedProfile(
  profiles: TeamProfiles,
  profileId: string,
  checked: boolean,
): TeamProfiles {
  const selectedProfiles = getSelectedProfileIds(profiles)

  if (checked) {
    return [...selectedProfiles, profileId]
  }

  return selectedProfiles.filter(
    (selectedProfileId) => selectedProfileId !== profileId,
  )
}

function getSelectedProfiles(
  profiles: TeamProfiles,
  profileOptions: ProfileOption[],
) {
  const selectedProfileIds = new Set(getSelectedProfileIds(profiles))

  return profileOptions.filter((profile) => selectedProfileIds.has(profile.id))
}

function RoleBadge({ role }: { role: "owner" | "admin" | "member" }) {
  const variant =
    role === "owner" ? "default" : role === "admin" ? "secondary" : "outline"

  return (
    <Badge variant={variant} className="capitalize">
      {role}
    </Badge>
  )
}

function StatusBadge({ row }: { row: TeamRow }) {
  if (row.type === "member") {
    return <Badge variant="outline">Member</Badge>
  }
  return <Badge variant="secondary">Pending</Badge>
}

function PermissionsSummary({
  profiles,
  profileOptions,
}: {
  profiles: TeamProfiles
  profileOptions: ProfileOption[]
}) {
  if (isAllPages(profiles)) {
    return <span className="text-sm text-muted-foreground">All Pages</span>
  }

  const selectedProfiles = getSelectedProfiles(profiles, profileOptions)

  if (selectedProfiles.length === 0) {
    const pageCount = getSelectedProfileIds(profiles).length

    return (
      <span className="text-sm text-muted-foreground">
        {pageCount} {pageCount === 1 ? "page" : "pages"}
      </span>
    )
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {selectedProfiles.slice(0, 2).map((profile) => (
        <Badge
          key={profile.id}
          variant="outline"
          className="max-w-32 truncate"
        >
          {profile.title}
        </Badge>
      ))}
      {selectedProfiles.length > 2 ? (
        <Badge variant="outline">+{selectedProfiles.length - 2} more</Badge>
      ) : null}
    </div>
  )
}

function TeamCard({
  profileOptions,
  rows,
}: {
  profileOptions: ProfileOption[]
  rows: TeamRow[]
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team members</CardTitle>
        <CardAction>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <HugeiconsIcon
                  icon={UserAdd01Icon}
                  size={16}
                  className="mr-2"
                />
                Invite member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <InviteDialogContent
                onSuccess={() => setIsDialogOpen(false)}
                profileOptions={profileOptions}
              />
            </DialogContent>
          </Dialog>
        </CardAction>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-16">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  No team members yet
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="pl-6">
                    {row.type === "member" ? (
                      <div className="flex items-center gap-3">
                        <Avatar size="sm">
                          <AvatarFallback>
                            {getInitials(row.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{row.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {row.email}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="font-medium">{row.email}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={row.role} />
                  </TableCell>
                  <TableCell>
                    <PermissionsSummary
                      profiles={
                        row.type === "member"
                          ? row.member.profiles
                          : row.invitation.profiles
                      }
                      profileOptions={profileOptions}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusBadge row={row} />
                  </TableCell>
                  <TableCell className="pr-16">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-muted-foreground">
                        {row.type === "member"
                          ? formatDate(row.date)
                          : formatExpiresAt(row.date)}
                      </span>
                      {row.type === "invitation" ? (
                        <InvitationActions invitation={row.invitation} />
                      ) : row.member.role === "member" ? (
                        <MemberActions
                          member={row.member}
                          profileOptions={profileOptions}
                        />
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function MemberActions({
  member,
  profileOptions,
}: {
  member: Member
  profileOptions: ProfileOption[]
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" size="sm" variant="ghost" className="pl-2!">
            <HugeiconsIcon icon={MoreHorizontal} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsDialogOpen(true)}>
            Edit permissions
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <MemberPermissionsDialogContent
          member={member}
          onSuccess={() => setIsDialogOpen(false)}
          profileOptions={profileOptions}
        />
      </DialogContent>
    </Dialog>
  )
}

function InvitationActions({ invitation }: { invitation: Invitation }) {
  const queryClient = useQueryClient()
  const resendInvitation = useMutation({
    mutationFn: (invitationId: string) =>
      apiClient.resendTeamInvitation(invitationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["team", "invitations"] })
    },
  })
  const revokeInvitation = useMutation({
    mutationFn: (invitationId: string) =>
      apiClient.revokeTeamInvitation(invitationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["team", "invitations"] })
    },
  })

  const [isResending, setIsResending] = useState(false)
  const [isRevoking, setIsRevoking] = useState(false)

  const handleResend = async () => {
    setIsResending(true)
    try {
      await resendInvitation.mutateAsync(invitation.invitationId)
    } finally {
      setIsResending(false)
    }
  }

  const handleRevoke = async () => {
    setIsRevoking(true)
    try {
      await revokeInvitation.mutateAsync(invitation.invitationId)
    } finally {
      setIsRevoking(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="pl-2!"
          disabled={isResending || isRevoking}
        >
          <HugeiconsIcon icon={MoreHorizontal} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleResend} disabled={isResending}>
          <HugeiconsIcon icon={Refresh01Icon} size={16} className="mr-2" />
          {isResending ? "Resending..." : "Resend invite"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleRevoke}
          disabled={isRevoking}
          variant="destructive"
        >
          <HugeiconsIcon icon={MoreHorizontal} size={16} className="mr-2" />
          {isRevoking ? "Revoking..." : "Revoke invite"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function PermissionsField({
  errors,
  onChange,
  profileOptions,
  profiles,
}: {
  errors?: Array<{ message?: string } | undefined>
  onChange: (profiles: TeamProfiles) => void
  profileOptions: ProfileOption[]
  profiles: TeamProfiles
}) {
  const selectedProfiles = getSelectedProfiles(profiles, profileOptions)
  const selectionMode = isAllPages(profiles) ? "all" : "selected"

  return (
    <Field data-invalid={Boolean(errors?.length)}>
      <FieldLabel>Permissions</FieldLabel>
      <FieldDescription>
        Choose whether this member can manage every page or only selected pages.
      </FieldDescription>

      <Tabs
        value={selectionMode}
        onValueChange={(value) => {
          onChange(value === "all" ? ["all"] : [])
        }}
      >
        <TabsList className="w-full">
          <TabsTrigger value="all">All Pages</TabsTrigger>
          <TabsTrigger value="selected">Selected Pages</TabsTrigger>
        </TabsList>
      </Tabs>

      {selectionMode === "selected" ? (
        <div className="space-y-3">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
              >
                {selectedProfiles.length === 0
                  ? "Select pages"
                  : `${selectedProfiles.length} ${selectedProfiles.length === 1 ? "page" : "pages"} selected`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80">
              {profileOptions.length === 0 ? (
                <DropdownMenuItem disabled>No pages available</DropdownMenuItem>
              ) : (
                profileOptions.map((profile) => (
                  <DropdownMenuCheckboxItem
                    key={profile.id}
                    checked={profiles.includes(profile.id)}
                    onSelect={(event) => event.preventDefault()}
                    onCheckedChange={(checked) => {
                      onChange(
                        toggleSelectedProfile(
                          profiles,
                          profile.id,
                          checked === true,
                        ),
                      )
                    }}
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-medium">
                        {profile.title}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {profile.username}
                      </span>
                    </div>
                  </DropdownMenuCheckboxItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {selectedProfiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No pages selected yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedProfiles.map((profile) => (
                <Badge key={profile.id} variant="outline">
                  {profile.title}
                </Badge>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          This member can manage every page in the team.
        </p>
      )}

      <FieldError errors={errors} />
    </Field>
  )
}

function InviteDialogContent({
  onSuccess,
  profileOptions,
}: {
  onSuccess: () => void
  profileOptions: ProfileOption[]
}) {
  const queryClient = useQueryClient()
  const createInvitation = useMutation({
    mutationFn: (body: {
      email: string
      role: "admin" | "member"
      profiles: TeamProfiles
    }) => apiClient.createTeamInvitation(body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["team", "invitations"] })
    },
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      email: "",
      role: "member" as "admin" | "member",
      profiles: ["all"] as string[],
    },
    validators: {
      onSubmit: inviteSchema,
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true)
      setSubmitError(null)

      try {
        await createInvitation.mutateAsync({
          email: value.email.trim().toLowerCase(),
          role: value.role,
          profiles:
            value.role === "admin" ? ["all"] : (value.profiles as TeamProfiles),
        })
        onSuccess()
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : "Failed to send invitation",
        )
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  return (
    <>
      <DialogHeader>
        <DialogTitle>Invite team member</DialogTitle>
      </DialogHeader>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          event.stopPropagation()
          void form.handleSubmit()
        }}
      >
        <FieldGroup className="py-6">
          <form.Field name="email">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel>Email address</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="colleague@example.com"
                    autoComplete="off"
                  />
                  {isInvalid ? (
                    <FieldError errors={field.state.meta.errors} />
                  ) : null}
                </Field>
              )
            }}
          </form.Field>

          <form.Field name="role">
            {(field) => (
              <Field>
                <FieldLabel>Role</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => {
                    field.handleChange(value as "admin" | "member")
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            )}
          </form.Field>

          <form.Subscribe selector={(state) => state.values.role}>
            {(role) =>
              role === "member" ? (
                <form.Field name="profiles">
                  {(field) => (
                    <PermissionsField
                      errors={field.state.meta.errors}
                      onChange={(profiles) => field.handleChange(profiles)}
                      profileOptions={profileOptions}
                      profiles={field.state.value as TeamProfiles}
                    />
                  )}
                </form.Field>
              ) : (
                <Field>
                  <FieldLabel>Permissions</FieldLabel>
                  <FieldDescription>
                    Admins always have access to all pages.
                  </FieldDescription>
                  <Badge variant="outline">All Pages</Badge>
                </Field>
              )
            }
          </form.Subscribe>

          {submitError ? (
            <p className="text-sm text-destructive" role="alert">
              {submitError}
            </p>
          ) : null}
        </FieldGroup>

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={onSuccess}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? "Sending..." : "Send invite"}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

function MemberPermissionsDialogContent({
  member,
  onSuccess,
  profileOptions,
}: {
  member: Member
  onSuccess: () => void
  profileOptions: ProfileOption[]
}) {
  const queryClient = useQueryClient()
  const updateMemberPermissions = useMutation({
    mutationFn: (body: { membershipId: string; profiles: TeamProfiles }) =>
      apiClient.updateTeamMemberPermissions(body.membershipId, {
        profiles: body.profiles,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["team", "members"] })
    },
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: {
      profiles: member.profiles as string[],
    },
    validators: {
      onSubmit: memberPermissionsSchema,
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true)
      setSubmitError(null)

      try {
        await updateMemberPermissions.mutateAsync({
          membershipId: member.membershipId,
          profiles: value.profiles as TeamProfiles,
        })
        onSuccess()
      } catch (error) {
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Failed to update permissions",
        )
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit member permissions</DialogTitle>
      </DialogHeader>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          event.stopPropagation()
          void form.handleSubmit()
        }}
      >
        <FieldGroup className="py-6">
          <Field>
            <FieldLabel>Member</FieldLabel>
            <div className="text-sm">
              <p className="font-medium">{member.name}</p>
              <p className="text-muted-foreground">{member.email}</p>
            </div>
          </Field>

          <form.Field name="profiles">
            {(field) => (
              <PermissionsField
                errors={field.state.meta.errors}
                onChange={(profiles) => field.handleChange(profiles)}
                profileOptions={profileOptions}
                profiles={field.state.value as TeamProfiles}
              />
            )}
          </form.Field>

          {submitError ? (
            <p className="text-sm text-destructive" role="alert">
              {submitError}
            </p>
          ) : null}
        </FieldGroup>

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={onSuccess}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}
