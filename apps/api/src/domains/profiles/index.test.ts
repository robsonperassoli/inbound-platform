import { beforeEach, describe, expect, it, vi } from "vitest"
import * as profiles from "./index"
import {
  createProfileForAccount,
  createUserAccount,
} from "../../test/factories"

vi.mock("../../integrations/storage.ts", () => ({
  resolveAssetUrl: vi.fn(async (key: string | null | undefined) =>
    key ? `https://cdn.example.com/${key}` : null,
  ),
}))

describe("profiles domain", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("creates a profile and reports username availability", async () => {
    const { account, user } = await createUserAccount()

    await expect(profiles.isUsernameAvailable("jane")).resolves.toBe(true)

    const profile = await profiles.createProfile({
      accountId: account.id,
      userId: user.id,
      username: "jane",
      title: "Jane Doe",
      bio: "Hello",
    })

    expect(profile).toMatchObject({
      username: "jane",
      title: "Jane Doe",
      accountId: account.id,
      userId: user.id,
    })

    await expect(profiles.isUsernameAvailable("jane")).resolves.toBe(false)
    await expect(
      profiles.createProfile({
        accountId: account.id,
        userId: user.id,
        username: "jane",
        title: "Taken",
      }),
    ).rejects.toThrow("Username taken")
  })

  it("scopes profile access to the owning account", async () => {
    const owner = await createUserAccount()
    const other = await createUserAccount()
    const { profile } = await createProfileForAccount({
      accountId: owner.account.id,
      userId: owner.user.id,
      username: "owner-page",
    })

    await expect(
      profiles.getProfileForAccount(profile.id, other.account.id),
    ).resolves.toBeNull()

    const owned = await profiles.getProfileForAccount(
      profile.id,
      owner.account.id,
    )
    expect(owned?.id).toBe(profile.id)
  })

  it("creates and reorders links for a profile", async () => {
    const { account, user, profile } = await createProfileForAccount({
      username: "links-page",
    })

    const first = await profiles.createLinkForProfile({
      profileId: profile.id,
      accountId: account.id,
      userId: user.id,
      title: "Website",
      type: "url",
      url: "https://example.com",
      order: 0,
    })
    const second = await profiles.createLinkForProfile({
      profileId: profile.id,
      accountId: account.id,
      userId: user.id,
      title: "Instagram",
      type: "social",
      platform: "instagram",
      url: "https://instagram.com/example",
      order: 1,
    })

    expect(first).toBeTruthy()
    expect(second).toBeTruthy()

    const reordered = await profiles.reorderLinksForProfile({
      profileId: profile.id,
      accountId: account.id,
      linkIds: [second!.id, first!.id],
    })
    expect(reordered).toBe(true)

    const withLinks = await profiles.getProfileWithLinks(
      profile.id,
      account.id,
    )
    expect(withLinks?.links.map((link) => link.id)).toEqual([
      second!.id,
      first!.id,
    ])
  })

  it("returns a public profile with resolved asset urls", async () => {
    const { account, profile } = await createProfileForAccount({
      username: "public-jane",
      title: "Public Jane",
      bio: "Bio text",
    })

    await profiles.updateProfileForAccount(profile.id, account.id, {
      avatarKey: "avatars/jane.png",
      backgroundImageKey: "backgrounds/jane.jpg",
      publishedAt: Date.now(),
    })

    await profiles.createLinkForProfile({
      profileId: profile.id,
      accountId: account.id,
      userId: profile.userId,
      title: "Site",
      type: "url",
      url: "https://example.com",
      active: true,
    })

    const publicProfile = await profiles.getPublicProfileByUsername(
      "public-jane",
    )

    expect(publicProfile).toMatchObject({
      profile: {
        username: "public-jane",
        title: "Public Jane",
        bio: "Bio text",
        avatarUrl: "https://cdn.example.com/avatars/jane.png",
        backgroundImageUrl: "https://cdn.example.com/backgrounds/jane.jpg",
      },
    })
    expect(publicProfile?.links).toHaveLength(1)
    expect(publicProfile?.links[0]).toMatchObject({
      title: "Site",
      type: "url",
      url: "https://example.com",
    })
  })

  it("lists account profile ids for permission checks", async () => {
    const { account, user } = await createUserAccount()
    const first = await createProfileForAccount({
      accountId: account.id,
      userId: user.id,
      username: "one",
    })
    const second = await createProfileForAccount({
      accountId: account.id,
      userId: user.id,
      username: "two",
    })

    const ids = await profiles.listAccountProfileIds(account.id)
    expect(ids.sort()).toEqual([first.profile.id, second.profile.id].sort())
  })
})
