import { describe, expect, it } from "vitest"
import * as accounts from "../domains/accounts/index"
import { createUserAccount } from "../test/factories"
import { client, withAuth } from "../test/http"

describe("invitations routes", () => {
  it("previews and accepts an invitation", async () => {
    const owner = await createUserAccount({
      email: "team-owner@example.com",
      name: "Owner",
      accountType: "team",
    })
    const invitee = await createUserAccount({
      email: "invitee@example.com",
      name: "Invitee",
    })

    const { token } = await accounts.createInvitation({
      accountId: owner.account.id,
      invitedByUserId: owner.user.id,
      email: "invitee@example.com",
      role: "admin",
      profiles: ["all"],
    })

    const previewRes = await client.invitations[":token"].$get(
      { param: { token } },
      withAuth(invitee.user.id),
    )
    expect(previewRes.status).toBe(200)
    expect(await previewRes.json()).toMatchObject({
      status: "valid",
      email: "invitee@example.com",
      role: "admin",
    })

    const acceptRes = await client.invitations[":token"].accept.$post(
      { param: { token } },
      withAuth(invitee.user.id),
    )
    expect(acceptRes.status).toBe(200)
    expect(await acceptRes.json()).toEqual({ ok: true })
  })
})
