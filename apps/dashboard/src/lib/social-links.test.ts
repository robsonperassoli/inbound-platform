import { describe, expect, it } from "vitest"
import {
  buildSocialLinks,
  buildSocialUrl,
  normalizeSocialHandle,
  type SocialHandles,
} from "./social-links"

describe("normalizeSocialHandle", () => {
  it("normalizes instagram handles", () => {
    expect(normalizeSocialHandle("instagram", "@creator_name")).toBe(
      "creator_name",
    )
    expect(
      normalizeSocialHandle("instagram", "https://instagram.com/creator_name/"),
    ).toBe("creator_name")
  })

  it("normalizes tiktok handles", () => {
    expect(normalizeSocialHandle("tiktok", "@creator")).toBe("creator")
    expect(
      normalizeSocialHandle("tiktok", "https://www.tiktok.com/@creator"),
    ).toBe("creator")
  })

  it("normalizes linkedin handles", () => {
    expect(normalizeSocialHandle("linkedin", "in/jane-doe")).toBe("jane-doe")
    expect(
      normalizeSocialHandle("linkedin", "https://linkedin.com/in/jane-doe/"),
    ).toBe("jane-doe")
  })

  it("normalizes youtube handles", () => {
    expect(normalizeSocialHandle("youtube", "@mychannel")).toBe("mychannel")
    expect(
      normalizeSocialHandle("youtube", "https://youtube.com/@mychannel"),
    ).toBe("mychannel")
  })

  it("normalizes x handles", () => {
    expect(normalizeSocialHandle("x", "@creator")).toBe("creator")
    expect(normalizeSocialHandle("x", "https://x.com/creator")).toBe("creator")
  })
})

describe("buildSocialUrl", () => {
  it("builds canonical social urls", () => {
    expect(buildSocialUrl("instagram", "creator")).toBe(
      "https://instagram.com/creator",
    )
    expect(buildSocialUrl("tiktok", "creator")).toBe(
      "https://tiktok.com/@creator",
    )
    expect(buildSocialUrl("facebook", "creator")).toBe(
      "https://facebook.com/creator",
    )
    expect(buildSocialUrl("linkedin", "creator")).toBe(
      "https://linkedin.com/in/creator",
    )
    expect(buildSocialUrl("youtube", "creator")).toBe(
      "https://youtube.com/creator",
    )
    expect(buildSocialUrl("youtube", "@creator")).toBe(
      "https://youtube.com/@creator",
    )
    expect(buildSocialUrl("x", "creator")).toBe("https://x.com/creator")
  })
})

describe("buildSocialLinks", () => {
  it("omits empty platforms and returns title/url pairs", () => {
    const handles: SocialHandles = {
      instagram: "@insta",
      tiktok: "",
      facebook: "fb-page",
      linkedin: "in/jane-doe",
      youtube: "",
      x: "@xcreator",
    }

    expect(buildSocialLinks(handles)).toEqual([
      { title: "Instagram", url: "https://instagram.com/insta" },
      { title: "Facebook", url: "https://facebook.com/fb-page" },
      { title: "LinkedIn", url: "https://linkedin.com/in/jane-doe" },
      { title: "X", url: "https://x.com/xcreator" },
    ])
  })
})
