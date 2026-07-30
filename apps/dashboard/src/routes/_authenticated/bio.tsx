import { ViewIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { useSiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { UserPage, type UserPageLink } from "@/components/user-page"
import { ChatPopup } from "@/components/user-page/chat-popup"
import { listProfiles } from "@/api/profiles"
import { useStartFormSession } from "@/hooks/queries/form-sessions"
import { queryKeys } from "@/hooks/queries/keys"
import {
  toUserPageLinks,
  toUserPageProfile,
  useSelectedProfile,
} from "@/hooks/queries/profiles"
import type { Profile } from "@/lib/types"
import { setSelectedProfile } from "@/stores/profiles"

export const Route = createFileRoute("/_authenticated/bio")({
  ssr: false,
  loader: async ({ context }) => {
    const profiles = await context.queryClient.ensureQueryData({
      queryKey: queryKeys.profiles,
      queryFn: async (): Promise<Profile[]> => {
        const result = await listProfiles()
        return result.profiles
      },
    })

    if (profiles.length === 0) {
      throw redirect({ to: "/onboarding" })
    }

    return { profileId: profiles[0]!.id }
  },
  component: RouteComponent,
})

function RouteComponent() {
  useSiteHeader({ title: "Bio" })

  const { profileId } = Route.useLoaderData()
  const profileData = useSelectedProfile()
  const startFormSession = useStartFormSession()
  const [sessionId, setSessionId] = useState<string>()
  const [chatOpen, setChatOpen] = useState(true)

  useEffect(() => {
    setSelectedProfile(profileId)
  }, [profileId])

  if (!profileData) {
    return null
  }

  const { profile, links } = profileData
  const previewProfile = toUserPageProfile(profile)
  const previewLinks = toUserPageLinks(links.filter((l) => l.active))

  const onFormLinkClick = async (link: UserPageLink) => {
    if (!link.formId || startFormSession.isPending || sessionId) return
    const data = await startFormSession.mutateAsync({
      profileId: profile.id,
      formId: link.formId,
    })
    setSessionId(data.sessionId)
    setChatOpen(true)
  }

  return (
    <>
      <div className="flex flex-1">
        <div className="w-full overflow-auto p-4">
          <Outlet />
        </div>

        <div className="hidden lg:flex w-xl xl:w-3xl 2xl:w-5xl border-l grow">
          <UserPage
            profile={previewProfile}
            links={previewLinks}
            className="min-h-96 w-full"
            onFormLinkClick={onFormLinkClick}
          />
        </div>
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button className="fixed right-5 bottom-5 lg:hidden shadow">
            <HugeiconsIcon icon={ViewIcon} /> Preview
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="end"
          className="p-0 w-sm max-w-full overflow-hidden"
        >
          <UserPage
            profile={previewProfile}
            links={previewLinks}
            className="min-h-[60vh]"
            onFormLinkClick={onFormLinkClick}
          />
        </PopoverContent>
      </Popover>
      {sessionId ? (
        <ChatPopup
          sessionId={sessionId}
          open={chatOpen}
          onOpen={() => setChatOpen(true)}
          onClose={() => setChatOpen(false)}
        />
      ) : null}
    </>
  )
}
