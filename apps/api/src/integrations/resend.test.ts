import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("resend", () => {
  const send = vi.fn()
  const Resend = vi.fn(
    function Resend(this: { emails: { send: typeof send } }) {
      this.emails = { send }
    },
  )
  return { Resend, send }
})

import * as resendSdk from "resend"
import { env } from "../lib/env"

const { Resend } = resendSdk
const send = (resendSdk as unknown as { send: ReturnType<typeof vi.fn> }).send
import { sendEmail, sendTemplateEmail } from "./resend"

const previousKey = env.RESEND_API_KEY

describe("resend integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    env.RESEND_API_KEY = undefined
    vi.spyOn(console, "info").mockImplementation(() => {})
  })

  afterEach(() => {
    env.RESEND_API_KEY = previousKey
    vi.restoreAllMocks()
  })

  it("requires html or text", async () => {
    await expect(
      sendEmail({
        to: "ada@example.com",
        from: "Inbound <hello@example.com>",
        subject: "Hi",
      }),
    ).rejects.toThrow(/html or text/)
    expect(Resend).not.toHaveBeenCalled()
  })

  it("logs and skips the SDK when RESEND_API_KEY is unset", async () => {
    await expect(
      sendEmail({
        to: "ada@example.com",
        from: "Inbound <hello@example.com>",
        subject: "Hi",
        text: "Hello",
      }),
    ).resolves.toEqual({ id: "dev-email" })
    expect(Resend).not.toHaveBeenCalled()
  })

  it("sends text, html, or both, and surfaces Resend errors", async () => {
    env.RESEND_API_KEY = "re_test"
    send.mockResolvedValueOnce({ data: { id: "text_1" }, error: null })
    send.mockResolvedValueOnce({ data: { id: "html_1" }, error: null })
    send.mockResolvedValueOnce({ data: { id: "both_1" }, error: null })
    send.mockResolvedValueOnce({ data: null, error: { message: "rejected" } })

    await expect(
      sendEmail({
        to: "ada@example.com",
        from: "Inbound <hello@example.com>",
        subject: "Text",
        text: "Hello",
        replyTo: "reply@example.com",
      }),
    ).resolves.toEqual({ id: "text_1" })

    await expect(
      sendEmail({
        to: "ada@example.com",
        from: "Inbound <hello@example.com>",
        subject: "Html",
        html: "<p>Hello</p>",
      }),
    ).resolves.toEqual({ id: "html_1" })

    await sendEmail({
      to: "ada@example.com",
      from: "Inbound <hello@example.com>",
      subject: "Both",
      html: "<p>Hello</p>",
      text: "Hello",
    })

    await expect(
      sendEmail({
        to: "ada@example.com",
        from: "Inbound <hello@example.com>",
        subject: "Nope",
        text: "Hello",
      }),
    ).rejects.toThrow("Resend error: rejected")

    expect(Resend).toHaveBeenCalledWith("re_test")
    expect(send).toHaveBeenNthCalledWith(1, {
      from: "Inbound <hello@example.com>",
      to: "ada@example.com",
      subject: "Text",
      replyTo: "reply@example.com",
      text: "Hello",
    })
    expect(send).toHaveBeenNthCalledWith(2, {
      from: "Inbound <hello@example.com>",
      to: "ada@example.com",
      subject: "Html",
      html: "<p>Hello</p>",
    })
    expect(send).toHaveBeenNthCalledWith(3, {
      from: "Inbound <hello@example.com>",
      to: "ada@example.com",
      subject: "Both",
      html: "<p>Hello</p>",
      text: "Hello",
    })
  })

  it("sends a template with optional subject and headers", async () => {
    env.RESEND_API_KEY = "re_test"
    send.mockResolvedValue({ data: { id: "tmpl_1" }, error: null })

    await sendTemplateEmail({
      to: "ada@example.com",
      from: "Inbound <hello@example.com>",
      templateId: "welcome",
      variables: { firstName: "Ada" },
    })
    await sendTemplateEmail({
      to: "ada@example.com",
      from: "Inbound <hello@example.com>",
      templateId: "welcome",
      variables: { firstName: "Ada", count: 2 },
      subject: "Welcome",
      headers: { "In-Reply-To": "<thread@inbound.click>" },
    })

    expect(send).toHaveBeenNthCalledWith(1, {
      from: "Inbound <hello@example.com>",
      to: "ada@example.com",
      template: { id: "welcome", variables: { firstName: "Ada" } },
    })
    expect(send).toHaveBeenNthCalledWith(2, {
      from: "Inbound <hello@example.com>",
      to: "ada@example.com",
      subject: "Welcome",
      template: {
        id: "welcome",
        variables: { firstName: "Ada", count: 2 },
      },
      headers: { "In-Reply-To": "<thread@inbound.click>" },
    })
  })
})
