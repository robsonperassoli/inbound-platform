import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../integrations/storage.ts", () => ({
  resolveAssetUrl: vi.fn(async (key: string | null | undefined) =>
    key ? `https://cdn.example.com/${key}` : null,
  ),
  createUploadUrl: vi.fn(async () => "https://upload.example.com"),
}))

vi.mock("../integrations/tinybird.ts", () => ({
  ingestLinkClick: vi.fn(async () => undefined),
  ingestPageView: vi.fn(async () => undefined),
  queryTinybirdEndpoint: vi.fn(async () => ({ data: [] })),
}))

import * as profiles from "../domains/profiles/index"
import { ingestLinkClick } from "../integrations/tinybird"
import { createProfileForAccount } from "../test/factories"
import { client } from "../test/http"

describe("public routes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns a public profile by username", async () => {
    const { profile } = await createProfileForAccount({
      username: "public-jane",
      title: "Public Jane",
    })

    const res = await client.public.profiles[":username"].$get({
      param: { username: "public-jane" },
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({
      profile: {
        id: profile.id,
        username: "public-jane",
        title: "Public Jane",
      },
      links: [],
    })
  })

  it("returns 404 for an unknown public profile", async () => {
    const res = await client.public.profiles[":username"].$get({
      param: { username: "missing-user" },
    })
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "Not found" })
  })

  it("records a link click", async () => {
    const { account, user, profile } = await createProfileForAccount({
      username: "click-page",
    })
    const link = await profiles.createLinkForProfile({
      profileId: profile.id,
      accountId: account.id,
      userId: user.id,
      title: "Site",
      type: "url",
      url: "https://example.com",
    })
    expect(link).toBeTruthy()

    const res = await client.public.links[":id"].click.$post(
      { param: { id: link!.id } },
      {
        init: {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitorId: "visitor_1" }),
        },
      },
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({
      url: "https://example.com",
      type: "url",
    })
    expect(ingestLinkClick).toHaveBeenCalled()
  })
})
