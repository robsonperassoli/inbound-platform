import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../integrations/resend.ts", () => ({
  sendSupportEmail: vi.fn(async () => undefined),
  sendInviteEmail: vi.fn(async () => undefined),
}))

import { sendSupportEmail } from "../integrations/resend"
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
    expect(sendSupportEmail).toHaveBeenCalled()
  })

  it("sends feedback", async () => {
    const { user } = await createUserAccount()
    const res = await client.feedback.$post(
      { json: { message: "Love it" } },
      withAuth(user.id),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(sendSupportEmail).toHaveBeenCalled()
  })
})
