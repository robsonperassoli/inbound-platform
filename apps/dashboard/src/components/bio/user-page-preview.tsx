import { UserPage } from "@inbound/ui"
import {
  toUserPageLinks,
  toUserPageProfile,
  useProfileWithLinks,
} from "@/hooks/queries/profiles"

export function UserPagePreview({
  profileId,
  live = false,
}: {
  profileId: string
  /** Poll for agent-driven theme updates. */
  live?: boolean
}) {
  const { data, isLoading } = useProfileWithLinks(profileId, {
    refetchInterval: live ? 500 : false,
  })

  if (isLoading || !data) {
    return null
  }

  return (
    <UserPage
      profile={toUserPageProfile(data.profile)}
      links={toUserPageLinks(data.links)}
      onFormLinkClick={() => {}}
      className="h-full"
    />
  )
}
