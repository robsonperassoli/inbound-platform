import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../domains/emails/index.ts", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../domains/emails/index.ts")>()
  return {
    ...actual,
    sendSupportEmail: vi.fn(async () => undefined),
    sendFeedbackEmail: vi.fn(async () => undefined),
    sendInviteEmail: vi.fn(async () => undefined),
    sendActivationEmail: vi.fn(async () => undefined),
  }
})

import {
  sendFeedbackEmail,
  sendSupportEmail,
} from "../domains/emails/index"
import { createUserAccount } from "../test/factories"
import { client, withAuth } from "../test/http"

describe("support routes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("sends a support message", async () => {
    const { user } = await createUserAccount()
    const res = await client.support.$post(
      { json: { message: "Need help" } },
      withAuth(user.id),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(sendSupportEmail).toHaveBeenCalledWith({
      fromEmail: user.email,
      message: "Need help",
    })
  })

  it("sends feedback", async () => {
    const { user } = await createUserAccount()
    const res = await client.feedback.$post(
      { json: { message: "Love it" } },
      withAuth(user.id),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(sendFeedbackEmail).toHaveBeenCalledWith({
      fromEmail: user.email,
      message: "Love it",
    })
  })
})
