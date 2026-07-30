import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../integrations/resend.ts", () => ({
  sendInviteEmail: vi.fn(async () => undefined),
  sendSupportEmail: vi.fn(async () => undefined),
}))

import { sendInviteEmail } from "../integrations/resend"
import { createUserAccount } from "../test/factories"
import { client, withAuth } from "../test/http"

describe("team routes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("lists team members for an owner", async () => {
    const { user } = await createUserAccount({ accountType: "team" })
    const res = await client.team.members.$get({}, withAuth(user.id))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.members).toEqual(
      expect.arrayContaining([expect.objectContaining({ userId: user.id })]),
    )
  })

  it("creates a team invitation", async () => {
    const { user } = await createUserAccount({ accountType: "team" })
    const res = await client.team.invitations.$post(
      {
        json: {
          email: "new-member@example.com",
          role: "member",
          profiles: ["all"],
        },
      },
      withAuth(user.id),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({
      invitationId: expect.any(String),
      token: expect.any(String),
      expiresAt: expect.any(Number),
    })
    expect(sendInviteEmail).toHaveBeenCalled()
  })
})
