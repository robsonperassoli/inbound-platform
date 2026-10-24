import { describe, expect, it } from "vitest"
import { getDefaultTheme } from "../themes"
import {
  accountTypeSchema,
  buttonShapeSchema,
  buttonStyleSchema,
  formFieldSchema,
  linkTypeSchema,
  memberRoleSchema,
  publicProfileResponseSchema,
  publicProfileSchema,
  sendFormSessionMessageInputSchema,
  socialPlatformSchema,
  startFormSessionInputSchema,
} from "./index"

describe("enum schemas", () => {
  const cases = [
    ["buttonShape", buttonShapeSchema, "pill", "circle"],
    ["buttonStyle", buttonStyleSchema, "ghost", "neon"],
    ["socialPlatform", socialPlatformSchema, "linkedin", "snapchat"],
    ["linkType", linkTypeSchema, "form", "pdf"],
    ["memberRole", memberRoleSchema, "owner", "guest"],
    ["accountType", accountTypeSchema, "individual", "org"],
  ] as const

  it.each(cases)("%s accepts %s and rejects %s", (_name, schema, ok, bad) => {
    expect(schema.safeParse(ok).success).toBe(true)
    expect(schema.safeParse(bad).success).toBe(false)
  })
})

describe("public profile schemas", () => {
  const theme = getDefaultTheme()

  const profile = {
    id: "profile-1",
    username: "ada",
    title: "Ada Lovelace",
    bio: "Analytical engine",
    avatarUrl: null,
    backgroundImageUrl: null,
    publishedAt: null,
    theme: theme.name,
    backgroundColor: theme.backgroundColor,
    fontFamily: theme.fontFamily,
    textColor: theme.textColor,
    buttonShape: theme.buttonShape,
    buttonStyle: theme.buttonStyle,
    buttonColor: theme.buttonColor,
    buttonTextColor: theme.buttonTextColor,
  }

  it("parses a draft profile that uses the default theme", () => {
    const parsed = publicProfileSchema.parse(profile)

    expect(parsed.username).toBe("ada")
    expect(parsed.publishedAt).toBeNull()
    expect(parsed.theme).toBe("Pearl White")
    expect(parsed.buttonShape).toBe(theme.buttonShape)
  })

  it("rejects a profile with an unknown button shape", () => {
    const result = publicProfileSchema.safeParse({
      ...profile,
      buttonShape: "circle",
    })

    expect(result.success).toBe(false)
  })

  it("parses a profile response with url, social, and form links", () => {
    const parsed = publicProfileResponseSchema.parse({
      profile: { ...profile, publishedAt: 1_700_000_000_000 },
      links: [
        {
          id: "link-1",
          title: "Site",
          order: 0,
          active: true,
          type: "url",
          url: "https://example.com",
          formId: null,
          platform: null,
        },
        {
          id: "link-2",
          title: "Instagram",
          order: 1,
          active: true,
          type: "social",
          url: "https://instagram.com/ada",
          platform: "instagram",
        },
        {
          id: "link-3",
          title: "Contact",
          order: 2,
          active: false,
          type: "form",
          formId: "form-1",
          url: null,
        },
      ],
    })

    expect(parsed.links.map((link) => link.type)).toEqual([
      "url",
      "social",
      "form",
    ])
    expect(parsed.profile.publishedAt).toBe(1_700_000_000_000)
  })

  it("rejects a response that omits links", () => {
    expect(publicProfileResponseSchema.safeParse({ profile }).success).toBe(
      false,
    )
  })
})

describe("form schemas", () => {
  it("accepts a required email field and rejects an unknown field type", () => {
    expect(
      formFieldSchema.safeParse({
        id: "field-1",
        type: "email",
        label: "Email",
        required: true,
      }).success,
    ).toBe(true)

    expect(
      formFieldSchema.safeParse({
        id: "field-1",
        type: "emoji",
        label: "Mood",
        required: false,
      }).success,
    ).toBe(false)
  })

  it("requires a profile id and form id to start a session", () => {
    expect(
      startFormSessionInputSchema.safeParse({
        profileId: "profile-1",
        formId: "form-1",
      }).success,
    ).toBe(true)
    expect(
      startFormSessionInputSchema.safeParse({ profileId: "profile-1" }).success,
    ).toBe(false)
  })

  it("rejects an empty form session message", () => {
    expect(
      sendFormSessionMessageInputSchema.safeParse({
        sessionId: "session-1",
        message: "Hello",
      }).success,
    ).toBe(true)
    expect(
      sendFormSessionMessageInputSchema.safeParse({
        sessionId: "session-1",
        message: "",
      }).success,
    ).toBe(false)
  })
})
