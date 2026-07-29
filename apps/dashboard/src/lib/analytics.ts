const REFERRER_MAP: Record<string, string> = {
  tiktok: "TikTok",
  "tiktok.com": "TikTok",
  instagram: "Instagram",
  "instagram.com": "Instagram",
  youtube: "YouTube",
  "youtube.com": "YouTube",
  facebook: "Facebook",
  "facebook.com": "Facebook",
  x: "X",
  twitter: "X",
  "twitter.com": "X",
  reddit: "Reddit",
  "reddit.com": "Reddit",
  linkedin: "LinkedIn",
  "linkedin.com": "LinkedIn",
  pinterest: "Pinterest",
  "pinterest.com": "Pinterest",
  snapchat: "Snapchat",
  "snapchat.com": "Snapchat",
}

export function extractReferrerName(referrer: string | null): string | null {
  if (!referrer) return null

  try {
    const url = new URL(referrer)
    const hostname = url.hostname.toLowerCase()

    for (const [key, value] of Object.entries(REFERRER_MAP)) {
      if (hostname.includes(key)) {
        return value
      }
    }

    return hostname
  } catch {
    return null
  }
}
