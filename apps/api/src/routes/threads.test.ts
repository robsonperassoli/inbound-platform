import { describe, expect, it } from "vitest"
import { createProfileForAccount } from "../test/factories"
import { client, withAuth } from "../test/http"

describe("threads routes", () => {
  it("starts a theme designer thread", async () => {
    const { user, profile } = await createProfileForAccount({
      username: "theme-page",
    })

    const res = await client.threads["theme-designer"].$post(
      { json: { profileId: profile.id } },
      withAuth(user.id),
    )
    expect(res.status).toBe(201)
    expect(await res.json()).toMatchObject({
      threadId: expect.any(String),
    })
  })

  it("starts a form builder thread", async () => {
    const { user, profile } = await createProfileForAccount({
      username: "form-builder-page",
    })

    const res = await client.threads["form-builder"].$post(
      { json: { profileId: profile.id } },
      withAuth(user.id),
    )
    expect(res.status).toBe(201)
    expect(await res.json()).toMatchObject({
      threadId: expect.any(String),
    })
  })
})
