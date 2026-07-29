import { describe, expect, it } from "vitest"
import {
  bugFeedbackSchema,
  featureFeedbackSchema,
  supportSchema,
} from "@/components/contact-schemas"

describe("supportSchema", () => {
  it("requires email, subject, category, and message", () => {
    const result = supportSchema.safeParse({
      email: "invalid",
      subject: "",
      category: "bio",
      message: "",
      routeContext: "",
    })

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(result.error.flatten().fieldErrors).toMatchObject({
        email: ["Enter a valid email address"],
        subject: ["Subject is required"],
        message: ["Message is required"],
      })
    }
  })
})

describe("featureFeedbackSchema", () => {
  it("requires the feature-specific fields", () => {
    const result = featureFeedbackSchema.safeParse({
      email: "creator@example.com",
      title: "",
      area: "forms",
      summary: "",
      requestedChange: "",
      impact: "",
    })

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(result.error.flatten().fieldErrors).toMatchObject({
        title: ["Idea title is required"],
        summary: ["Tell us what you are trying to do"],
        requestedChange: ["Tell us what should change"],
      })
    }
  })
})

describe("bugFeedbackSchema", () => {
  it("requires the bug-specific fields", () => {
    const result = bugFeedbackSchema.safeParse({
      email: "creator@example.com",
      title: "",
      area: "account",
      summary: "",
      expectedBehavior: "",
      reproSteps: "",
    })

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(result.error.flatten().fieldErrors).toMatchObject({
        title: ["Bug title is required"],
        summary: ["Tell us what happened"],
        expectedBehavior: ["Tell us what you expected to happen"],
      })
    }
  })
})
