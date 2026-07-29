import { describe, expect, it } from "vitest"
import { buildPublicProfileHead } from "@/lib/public-profile"

describe("buildPublicProfileHead", () => {
  it("returns draft metadata for unpublished profiles", () => {
    const result = buildPublicProfileHead({
      state: "unpublished",
      profile: {
        username: "jane",
        title: "Jane Doe",
        bio: "Launching soon",
        avatarUrl: "https://example.com/avatar.png",
      },
    })

    expect(result.meta).toContainEqual({ title: "Jane Doe | Coming Soon" })
    expect(result.meta).toContainEqual({
      name: "robots",
      content: "noindex, nofollow",
    })
    expect(result.meta).toContainEqual({
      property: "og:type",
      content: "website",
    })
  })

  it("returns live metadata for published profiles", () => {
    const result = buildPublicProfileHead({
      state: "published",
      profile: {
        username: "jane",
        title: "Jane Doe",
        bio: "Founder and operator",
        avatarUrl: null,
      },
    })

    expect(result.meta).toContainEqual({ title: "Jane Doe" })
    expect(result.meta).toContainEqual({
      name: "robots",
      content: "index, follow",
    })
    expect(result.meta).toContainEqual({
      property: "og:type",
      content: "profile",
    })
  })
})
