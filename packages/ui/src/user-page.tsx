import type { UserPageLink, UserPageProfile } from "@inbound/shared"
import {
  getUserPageFontClassName,
  getUserPageFontTracking,
} from "@inbound/shared"
import { useEffect, type CSSProperties } from "react"
import { Avatar, AvatarImage } from "./components/avatar"
import { getRelativeLuminance } from "./lib/colors"
import { loadFont } from "./lib/load-font"
import { cn } from "./lib/utils"
import { Button } from "./user-page/button"
import { SocialLink } from "./user-page/social-link"

export type { UserPageLink, UserPageProfile }

export function UserPage({
  profile,
  links,
  className,
  onFormLinkClick,
}: {
  profile: UserPageProfile
  links: UserPageLink[]
  className?: string
  onFormLinkClick: (link: UserPageLink) => void
}) {
  useEffect(() => {
    if (profile.fontFamily) {
      void loadFont(profile.fontFamily)
    }
  }, [profile.fontFamily])

  const socialLinks = links.filter((link) => link.type === "social")
  const buttonLinks = links.filter((link) => link.type !== "social")

  const luminance = getRelativeLuminance(profile.backgroundColor)
  const isDarkCard = luminance < 0.2
  const isLightCard = luminance > 0.75
  const overlayColor = isDarkCard
    ? "rgb(255 255 255 / 0.22)"
    : isLightCard
      ? "rgb(15 23 42 / 0.18)"
      : "rgb(17 24 39 / 0.4)"
  const overlayGradient = isDarkCard
    ? "linear-gradient(180deg, rgb(255 255 255 / 0.18), rgb(255 255 255 / 0.32))"
    : isLightCard
      ? "linear-gradient(180deg, rgb(15 23 42 / 0.08), rgb(15 23 42 / 0.2))"
      : "linear-gradient(180deg, rgb(17 24 39 / 0.28), rgb(17 24 39 / 0.5))"
  const fontClassName = getUserPageFontClassName(profile.fontFamily)
  const fontTracking = getUserPageFontTracking(profile.fontFamily)

  return (
    <div
      className={cn(
        "relative flex @container/user-page bg-up-background text-up-foreground",
        fontClassName,
        className,
      )}
      style={
        {
          "--up-background": profile.backgroundColor,
          "--up-foreground": profile.textColor,
          "--up-button-background": profile.buttonColor,
          "--up-button-foreground": profile.buttonTextColor,
        } as CSSProperties
      }
    >
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: overlayGradient,
          backgroundColor: overlayColor,
          backgroundPosition: "center top",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
        }}
      />

      <div
        className={cn(
          "relative z-0 mx-auto flex-1 max-w-xl bg-up-background",
          "px-4 py-8 @xl/user-page:px-8 @xl/user-page:py-12",
          "@xl/user-page:shadow-2xl @xl/user-page:mt-8 @xl/user-page:rounded-t-[3rem]",
        )}
        style={{
          backgroundImage: profile.backgroundImageUrl
            ? `url(${profile.backgroundImageUrl})`
            : undefined,
          backgroundPosition: "center top",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          boxShadow: isDarkCard
            ? "0 28px 80px rgb(0 0 0 / 0.45)"
            : isLightCard
              ? "0 28px 80px rgb(15 23 42 / 0.08)"
              : "0 28px 80px rgb(15 23 42 / 0.14)",
        }}
      >
        <header className="space-y-5 @md/user-page:space-y-6">
          {profile.avatarUrl && (
            <Avatar className="mx-auto block size-24 shadow-lg @md/user-page:size-28">
              <AvatarImage src={profile.avatarUrl} />
            </Avatar>
          )}

          <div className="space-y-1.5 text-center @md/user-page:space-y-2">
            <h1
              className={cn(
                "text-[1.9rem] leading-none font-semibold @md/user-page:text-[2.35rem]",
                fontTracking.heading,
              )}
            >
              {profile.title}
            </h1>
            {profile.bio && (
              <p className="text-base leading-snug @md/user-page:text-lg">
                {profile.bio}
              </p>
            )}
          </div>
        </header>

        <ul className="mx-auto mt-8 flex max-w-md flex-col justify-center gap-y-4 @md/user-page:mt-9 @md/user-page:gap-y-4.5">
          {buttonLinks.map((link) => (
            <li key={link.id} className="min-w-0 flex">
              <Button
                {...(link.type === "url"
                  ? { href: link.url }
                  : { onClick: () => onFormLinkClick(link) })}
                shape={profile.buttonShape}
                buttonStyle={profile.buttonStyle}
                className="truncate text-ellipsis"
                labelClassName={cn(
                  "block truncate text-ellipsis",
                  fontTracking.body,
                )}
              >
                {link.title}
              </Button>
            </li>
          ))}
        </ul>

        {socialLinks.length > 0 && (
          <ul className="mt-8 flex justify-center @md/user-page:mt-9">
            {socialLinks.map((l) => (
              <li key={l.id}>
                <SocialLink link={l} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
