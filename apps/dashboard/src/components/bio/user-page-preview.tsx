import { UserPage } from "@inbound/ui"
import {
  toUserPageLinks,
  toUserPageProfile,
  useProfileWithLinks,
} from "@/hooks/queries"

export function UserPagePreview({ profileId }: { profileId: string }) {
  const { data, isLoading } = useProfileWithLinks(profileId)

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
