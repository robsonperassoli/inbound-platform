import { describe, expect, it } from "vitest"
import {
  buildSocialLinks,
  buildSocialUrl,
  normalizeSocialHandle,
  socialConfig,
  socialPlatforms,
  type SocialHandles,
} from "./social-links"

const emptyHandles: SocialHandles = {
  instagram: "",
  tiktok: "",
  facebook: "",
  linkedin: "",
  youtube: "",
  x: "",
}

describe("social config", () => {
  it("has a title, prefix, and icon for every platform", () => {
    expect(Object.keys(socialConfig).toSorted()).toEqual(
      socialPlatforms.toSorted(),
    )

    for (const platform of socialPlatforms) {
      const config = socialConfig[platform]
      expect(config.title.length).toBeGreaterThan(0)
      expect(config.prefix).toMatch(/\.com\/?/)
      expect(config.icon.length).toBeGreaterThan(0)
    }
  })
})

describe("normalizeSocialHandle", () => {
  it("strips @, trailing slashes, and query strings from profile urls", () => {
    expect(normalizeSocialHandle("instagram", "  @creator  ")).toBe("creator")
    expect(
      normalizeSocialHandle(
        "instagram",
        "https://instagram.com/creator/?hl=en",
      ),
    ).toBe("creator")
    expect(normalizeSocialHandle("instagram", "   ")).toBe("")
  })

  it("keeps the linkedin slug that follows /in/", () => {
    expect(normalizeSocialHandle("linkedin", "in/jane-doe")).toBe("jane-doe")
    expect(
      normalizeSocialHandle(
        "linkedin",
        "https://www.linkedin.com/in/jane-doe/",
      ),
    ).toBe("jane-doe")
  })

  it("drops the @ from tiktok, youtube, and x handles", () => {
    expect(
      normalizeSocialHandle("tiktok", "https://www.tiktok.com/@creator"),
    ).toBe("creator")
    expect(
      normalizeSocialHandle("youtube", "https://youtube.com/@mychannel"),
    ).toBe("mychannel")
    expect(normalizeSocialHandle("x", "https://x.com/creator")).toBe("creator")
  })
})

describe("buildSocialUrl", () => {
  it("builds a canonical url and returns null for a blank handle", () => {
    expect(buildSocialUrl("instagram", "creator")).toBe(
      "https://instagram.com/creator",
    )
    expect(buildSocialUrl("tiktok", "@creator")).toBe(
      "https://tiktok.com/@creator",
    )
    expect(buildSocialUrl("facebook", "creator")).toBe(
      "https://facebook.com/creator",
    )
    expect(buildSocialUrl("linkedin", "jane-doe")).toBe(
      "https://linkedin.com/in/jane-doe",
    )
    expect(buildSocialUrl("x", "@creator")).toBe("https://x.com/creator")
    expect(buildSocialUrl("instagram", "   ")).toBeNull()
  })

  it("preserves a youtube @ only when the input was a handle", () => {
    expect(buildSocialUrl("youtube", "@mychannel")).toBe(
      "https://youtube.com/@mychannel",
    )
    expect(buildSocialUrl("youtube", "https://youtube.com/@mychannel")).toBe(
      "https://youtube.com/@mychannel",
    )
    expect(buildSocialUrl("youtube", "channelname")).toBe(
      "https://youtube.com/channelname",
    )
  })
})

describe("buildSocialLinks", () => {
  it("omits empty platforms and keeps the platform order", () => {
    const links = buildSocialLinks({
      ...emptyHandles,
      instagram: "@insta",
      facebook: "fb-page",
      linkedin: "in/jane-doe",
      x: "@xcreator",
    })

    expect(links).toEqual([
      { title: "Instagram", url: "https://instagram.com/insta" },
      { title: "Facebook", url: "https://facebook.com/fb-page" },
      { title: "LinkedIn", url: "https://linkedin.com/in/jane-doe" },
      { title: "X", url: "https://x.com/xcreator" },
    ])
  })
})
