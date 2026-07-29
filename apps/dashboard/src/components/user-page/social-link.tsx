import { HugeiconsIcon } from "@hugeicons/react"
import { socialConfig } from "@/lib/social-links"
import type { UserPageLink } from "../user-page"

export function SocialLink({ link }: { link: UserPageLink }) {
  if (!link.platform || !link.url) {
    return null
  }

  const platformConfig = socialConfig[link.platform]
  return (
    <a
      href={link.url}
      target="_blank"
      className="size-12 p-2 block hover:scale-[107.5%] transition-transform"
    >
      <HugeiconsIcon icon={platformConfig.icon} className="w-full h-full" />
    </a>
  )
}
