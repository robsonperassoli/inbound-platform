"use client"


import {
  CreditCardIcon,
  LogoutIcon,
  NotificationIcon,
  SparklesIcon,
  UnfoldMoreIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Link, useNavigate } from "@tanstack/react-router"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useSession } from "@/hooks/use-session"
import { useCreatePortal } from "@/hooks/queries/billing"
import { getInitials } from "@/lib/names"

export function NavUser() {
  const navigate = useNavigate()
  const session = useSession()
  const createPortal = useCreatePortal()

  const signOut = async () => {
    await navigate({ to: "/logout", reloadDocument: true })
  }

  const { isMobile } = useSidebar()

  const goToStripeCustomerPortal = async () => {
    const result = await createPortal.mutateAsync()
    if (!result?.url) {
      console.error("Empty customer portal URL")
      return
    }

    window.location.href = result.url
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {session?.image && (
                  <AvatarImage src={session.image} alt={session.name} />
                )}

                <AvatarFallback className="rounded-lg">
                  {session?.name ? getInitials(session.name) : null}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{session?.name}</span>
                <span className="truncate text-xs">{session?.email}</span>
              </div>
              <HugeiconsIcon
                icon={UnfoldMoreIcon}
                strokeWidth={2}
                className="ml-auto size-4"
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {session?.image && (
                    <AvatarImage src={session.image} alt={session.name} />
                  )}
                  <AvatarFallback className="rounded-lg">
                    {session?.name ? getInitials(session.name) : null}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{session?.name}</span>
                  <span className="truncate text-xs">{session?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>

            {session?.subscribed === false && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link to="/upgrade">
                      <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} />
                      Upgrade to Pro
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {session?.isSuperUser && (
                <DropdownMenuItem asChild>
                  <Link to="/system/users">
                    <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} />
                    Users
                  </Link>
                </DropdownMenuItem>
              )}

              {session?.accountType === "team" && session.role !== "member" && (
                <DropdownMenuItem asChild>
                  <Link to="/team">
                    <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} />
                    Team
                  </Link>
                </DropdownMenuItem>
              )}

              {session?.subscribed === true && session.role !== "member" && (
                <DropdownMenuItem onClick={goToStripeCustomerPortal}>
                  <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2} />
                  Billing
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <HugeiconsIcon icon={NotificationIcon} strokeWidth={2} />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <HugeiconsIcon icon={LogoutIcon} strokeWidth={2} />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
