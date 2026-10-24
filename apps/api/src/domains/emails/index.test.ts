import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../../integrations/resend.ts", () => ({
  sendEmail: vi.fn(),
  sendTemplateEmail: vi.fn(),
}))

import { sendEmail, sendTemplateEmail } from "../../integrations/resend"
import { env } from "../../lib/env"
import {
  getFirstName,
  sendActivationEmail,
  sendChatCompletedEmail,
  sendFeedbackEmail,
  sendInviteEmail,
  sendNewConversationEmail,
  sendSalesLeadEmail,
  sendSupportEmail,
} from "./index"

const previousEmails = {
  SUPPORT_EMAIL: env.SUPPORT_EMAIL,
  SALES_EMAIL: env.SALES_EMAIL,
  FEEDBACK_EMAIL: env.FEEDBACK_EMAIL,
}

describe("emails", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    env.SUPPORT_EMAIL = undefined
    env.SALES_EMAIL = undefined
    env.FEEDBACK_EMAIL = undefined
    vi.mocked(sendEmail).mockResolvedValue({ id: "email_1" })
    vi.mocked(sendTemplateEmail).mockResolvedValue({ id: "email_2" })
  })

  afterEach(() => {
    env.SUPPORT_EMAIL = previousEmails.SUPPORT_EMAIL
    env.SALES_EMAIL = previousEmails.SALES_EMAIL
    env.FEEDBACK_EMAIL = previousEmails.FEEDBACK_EMAIL
  })

  it("uses the first name, or a fallback when the name is blank", () => {
    expect(getFirstName("Ada Lovelace")).toBe("Ada")
    expect(getFirstName("  Ada  ")).toBe("Ada")
    expect(getFirstName("")).toBe("there")
    expect(getFirstName("   ")).toBe("there")
    expect(getFirstName(null)).toBe("there")
    expect(getFirstName(undefined)).toBe("there")
  })

  it("sends an invite from the inviter, or Someone when the name is blank", async () => {
    await sendInviteEmail({
      to: "member@example.com",
      inviteUrl: "https://app.example/invite/token",
      inviterName: "Ada Lovelace",
    })
    await sendInviteEmail({
      to: "member@example.com",
      inviteUrl: "https://app.example/invite/token",
      inviterName: "  ",
    })

    expect(sendEmail).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        to: "member@example.com",
        from: "Inbound.click <robson@send.inbound.click>",
        subject: "You've been invited to join Inbound.click",
        text: expect.stringContaining("Ada Lovelace has invited you"),
      }),
    )
    const second = vi.mocked(sendEmail).mock.calls[1]?.[0]
    expect(second?.text).toContain("Someone has invited you")
    expect(second?.text).toContain("https://app.example/invite/token")
    expect(second?.text).toContain("expires in 7 days")
  })

  it("logs support locally when SUPPORT_EMAIL is unset", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {})

    await expect(
      sendSupportEmail({
        fromEmail: "ada@example.com",
        message: "  help  ",
      }),
    ).resolves.toEqual({ id: "dev-support" })
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it("sends support mail to SUPPORT_EMAIL", async () => {
    env.SUPPORT_EMAIL = "support@example.com"

    await sendSupportEmail({
      fromEmail: "ada@example.com",
      message: "  help  ",
    })

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "support@example.com",
        replyTo: "ada@example.com",
        subject: "[Support] request from ada@example.com",
        text: expect.stringContaining("help"),
      }),
    )
  })

  it("uses the feedback inbox, then support, then a local log", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {})
    await expect(
      sendFeedbackEmail({ fromEmail: "ada@example.com", message: "nice" }),
    ).resolves.toEqual({ id: "dev-feedback" })

    env.SUPPORT_EMAIL = "support@example.com"
    await sendFeedbackEmail({ fromEmail: "ada@example.com", message: "nice" })

    env.FEEDBACK_EMAIL = "feedback@example.com"
    await sendFeedbackEmail({
      fromEmail: "ada@example.com",
      message: " nicer ",
    })

    expect(sendEmail).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        to: "support@example.com",
        subject: "[Feedback] from ada@example.com",
      }),
    )
    expect(sendEmail).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        to: "feedback@example.com",
        text: expect.stringContaining("nicer"),
      }),
    )
  })

  it("sends a sales lead, filling missing fields, or logs when no inbox is set", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {})
    await expect(
      sendSalesLeadEmail({
        email: "ada@example.com",
        phone: "555",
        companyName: "Acme",
      }),
    ).resolves.toEqual({ id: "dev-sales" })

    env.SALES_EMAIL = "sales@example.com"
    await sendSalesLeadEmail({
      email: "ada@example.com",
      phone: "555",
      companyName: "Acme",
      leadName: "Ada",
      username: "ada",
      userAgent: "TestBrowser",
    })

    const payload = vi.mocked(sendEmail).mock.calls[0]?.[0]
    expect(payload).toMatchObject({
      to: "sales@example.com",
      replyTo: "ada@example.com",
      subject: "[Sales Lead] Team pricing inquiry",
    })
    expect(payload?.text).toContain("Lead email: ada@example.com")
    expect(payload?.text).toContain("Lead name: Ada")
    expect(payload?.text).toContain("Phone: 555")
    expect(payload?.text).toContain("Company name: Acme")
    expect(payload?.text).toContain("Subject: Team pricing inquiry")
    expect(payload?.text).toContain("Browser: TestBrowser")
    expect(payload?.text).toContain("Username: ada")
    expect(payload?.text).toContain("Submitted at: ")
  })

  it("falls back to the support inbox for sales leads", async () => {
    env.SUPPORT_EMAIL = "support@example.com"

    await sendSalesLeadEmail({
      email: "ada@example.com",
      phone: " ",
      companyName: "Acme",
      leadName: " ",
    })

    const payload = vi.mocked(sendEmail).mock.calls[0]?.[0]
    expect(payload?.to).toBe("support@example.com")
    expect(payload?.text).toContain("Lead name: Not provided")
    expect(payload?.text).toContain("Phone: Not provided")
    expect(payload?.text).toContain("Browser: Not provided")
    expect(payload?.text).toContain("Username: Not provided")
  })

  it("sends conversation templates with transcript threading headers", async () => {
    await sendNewConversationEmail({
      to: "ada@example.com",
      firstName: "Ada",
      transcriptUrl: "https://app.example/transcript",
      formSubmissionId: "sub_1",
    })
    await sendChatCompletedEmail({
      to: "ada@example.com",
      firstName: "Ada",
      transcriptUrl: "https://app.example/transcript",
      formSubmissionId: "sub_1",
      status: "abandoned",
    })
    await sendChatCompletedEmail({
      to: "ada@example.com",
      firstName: "Ada",
      transcriptUrl: "https://app.example/transcript",
      formSubmissionId: "sub_1",
      status: "finished",
    })
    await sendActivationEmail({
      to: "ada@example.com",
      firstName: "Ada",
      username: "ada",
    })

    expect(sendTemplateEmail).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        from: "Inbound.Click <notifications@send.inbound.click>",
        to: "ada@example.com",
        templateId: "new-conversation",
        variables: {
          firstName: "Ada",
          formSubmissionTranscriptUrl: "https://app.example/transcript",
        },
        headers: {
          "In-Reply-To": "<sub_1@inbound.click>",
          References: "<sub_1@inbound.click>",
        },
      }),
    )

    const abandoned = vi.mocked(sendTemplateEmail).mock.calls[1]?.[0]
    expect(abandoned?.templateId).toBe("chat-completed")
    expect(abandoned?.variables?.statusMessage).toContain("stopped responding")

    const finished = vi.mocked(sendTemplateEmail).mock.calls[2]?.[0]
    expect(finished?.variables?.statusMessage).toContain("finished")

    expect(sendTemplateEmail).toHaveBeenNthCalledWith(
      4,
      expect.objectContaining({
        from: "Robson <robson@send.inbound.click>",
        templateId: "lead-capture-activation-1",
        variables: { firstName: "Ada", username: "ada" },
      }),
    )
  })
})
