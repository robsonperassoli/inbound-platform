import type { Profile } from "@/lib/types"
import { Plus, UnfoldMoreIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useEffect, useMemo, useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useProfiles } from "@/hooks/queries/profiles"
import { useSession } from "@/hooks/use-session"
import { getInitials } from "@/lib/names"
import { setSelectedProfile, useSelectedProfileId } from "@/stores/profiles"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { CreateProfileModal } from "./create-profile-modal"

export function useProfileSwitcher() {
  const { data: profiles } = useProfiles()
  const profileId = useSelectedProfileId()

  const profile = useMemo(
    () => profiles?.find((p) => p.id === profileId) ?? null,
    [profiles, profileId],
  )

  useEffect(() => {
    if (!profileId && profiles && profiles.length > 0) {
      setSelectedProfile(profiles[0]!.id)
    }
  }, [profiles, profileId])

  return { profile, profiles: profiles ?? [] }
}

export function ProfileSwitcher({
  profiles,
  profile,
}: {
  profiles: Array<Profile>
  profile: Profile | null
}) {
  const { isMobile } = useSidebar()
  const session = useSession()
  const [isCreateProfileOpen, setIsCreateProfileOpen] = useState(false)
  const canCreateProfile =
    session?.membership.role === "owner" ||
    session?.membership.role === "admin"

  if (!profile) {
    return null
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
              <Avatar size="default">
                {/*<AvatarImage src={profile.avatarUrl} />*/}
                <AvatarFallback>{getInitials(profile.title)}</AvatarFallback>
              </Avatar>
              {/*<div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              </div>*/}
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{profile.title}</span>
                <span className="truncate text-xs">{profile.username}</span>
              </div>
              <HugeiconsIcon icon={UnfoldMoreIcon} className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Pages
            </DropdownMenuLabel>
            {profiles?.map((item, index) => (
              <DropdownMenuItem
                key={item.username}
                onClick={() => setSelectedProfile(item.id)}
                className="gap-2 p-2"
              >
                <Avatar size="sm">
                  {/*<AvatarImage src={item.avatarUrl} />*/}
                  <AvatarFallback>{getInitials(item.title)}</AvatarFallback>
                </Avatar>
                {item.title}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            {canCreateProfile ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 p-2"
                  onClick={() => setIsCreateProfileOpen(true)}
                >
                  <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                    <HugeiconsIcon icon={Plus} className="size-4" />
                  </div>
                  <div className="font-medium text-muted-foreground">
                    Add page
                  </div>
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
        <CreateProfileModal
          open={isCreateProfileOpen}
          onOpenChange={setIsCreateProfileOpen}
          onCreated={(profileId) => {
            setSelectedProfile(profileId)
          }}
        />
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
