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
