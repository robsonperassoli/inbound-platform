import type { HugeiconsIconProps } from "@hugeicons/react"
import {
  CustomFacebookIcon,
  CustomInstagramIcon,
  CustomLinkedinIcon,
  CustomTiktokIcon,
  CustomXIcon,
  CustomYoutubeIcon,
} from "./social-icons"

export type SocialPlatform =
  | "instagram"
  | "tiktok"
  | "facebook"
  | "linkedin"
  | "youtube"
  | "x"

export type SocialHandles = Record<SocialPlatform, string>

type SocialConfig = {
  title: string
  prefix: string
  icon: HugeiconsIconProps["icon"]
  fieldLabel: string
  placeholder: string
}

export const socialConfig: Record<SocialPlatform, SocialConfig> = {
  instagram: {
    title: "Instagram",
    prefix: "instagram.com/",
    icon: CustomInstagramIcon,
    fieldLabel: "username",
    placeholder: "@creator",
  },
  tiktok: {
    title: "TikTok",
    prefix: "tiktok.com/@",
    icon: CustomTiktokIcon,
    fieldLabel: "username",
    placeholder: "@creator",
  },
  facebook: {
    title: "Facebook",
    prefix: "facebook.com/",
    icon: CustomFacebookIcon,
    fieldLabel: "username",
    placeholder: "yourpage",
  },
  linkedin: {
    title: "LinkedIn",
    prefix: "linkedin.com/in/",
    icon: CustomLinkedinIcon,
    fieldLabel: "username",
    placeholder: "jane-doe",
  },
  youtube: {
    title: "YouTube",
    prefix: "youtube.com/",
    icon: CustomYoutubeIcon,
    fieldLabel: "handle",
    placeholder: "@channelname or channelname",
  },
  x: {
    title: "X",
    prefix: "x.com/",
    icon: CustomXIcon,
    fieldLabel: "handle",
    placeholder: "@creator",
  },
}

export const socialPlatforms = [
  "instagram",
  "tiktok",
  "facebook",
  "linkedin",
  "youtube",
  "x",
] as const satisfies readonly SocialPlatform[]

const sanitizeRawInput = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return ""
  }

  const withProtocol =
    /^https?:\/\//i.test(trimmed) || !trimmed.includes(".")
      ? trimmed
      : `https://${trimmed}`

  try {
    const parsed = new URL(withProtocol)
    return decodeURIComponent(parsed.pathname)
  } catch {
    return trimmed
  }
}

export const normalizeSocialHandle = (
  platform: SocialPlatform,
  value: string,
) => {
  const sanitized = sanitizeRawInput(value)
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .split(/[?#]/)[0]

  if (!sanitized) {
    return ""
  }

  const segments = sanitized
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)

  let handle = segments[0] ?? ""

  if (platform === "linkedin") {
    if (segments[0]?.toLowerCase() === "in" && segments[1]) {
      handle = segments[1]
    } else {
      handle = handle.replace(/^in\//i, "")
    }
  }

  if (platform === "x" && segments[0]?.toLowerCase() === "@" && segments[1]) {
    handle = segments[1]
  }

  handle = handle.replace(/^@+/, "").trim()

  return handle
}

export const buildSocialUrl = (platform: SocialPlatform, handle: string) => {
  const normalized = normalizeSocialHandle(platform, handle)
  if (!normalized) {
    return null
  }

  if (platform === "tiktok") {
    return `https://${platform}.com/@${normalized}`
  }

  if (platform === "youtube") {
    const trimmed = handle.trim()
    const usesHandle = trimmed.startsWith("@") || trimmed.includes("/@")

    return `https://youtube.com/${usesHandle ? "@" : ""}${normalized}`
  }

  if (platform === "linkedin") {
    return `https://linkedin.com/in/${normalized}`
  }

  if (platform === "x") {
    return `https://x.com/${normalized}`
  }

  return `https://${platform}.com/${normalized}`
}

export const buildSocialLinks = (handles: SocialHandles) => {
  return socialPlatforms
    .map((platform) => {
      const url = buildSocialUrl(platform, handles[platform])
      if (!url) {
        return null
      }

      return {
        title: socialConfig[platform].title,
        url,
      }
    })
    .filter((link): link is { title: string; url: string } => Boolean(link))
}
