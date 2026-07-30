import { describe, expect, it } from "vitest"
import { createProfileForAccount } from "../test/factories"
import { client, withAuth } from "../test/http"

describe("links routes", () => {
  it("patches and deletes a link", async () => {
    const { user, profile } = await createProfileForAccount({
      username: "links-owner",
    })

    const createRes = await client.profiles[":id"].links.$post(
      {
        param: { id: profile.id },
        json: {
          title: "Website",
          type: "url",
          url: "https://example.com",
        },
      },
      withAuth(user.id),
    )
    expect(createRes.status).toBe(201)
    if (!createRes.ok) throw new Error(`unexpected status ${createRes.status}`)
    const { link } = await createRes.json()

    const patchRes = await client.links[":id"].$patch(
      {
        param: { id: link.id },
        json: { title: "Homepage" },
      },
      withAuth(user.id),
    )
    expect(patchRes.status).toBe(200)
    expect(await patchRes.json()).toMatchObject({
      link: { id: link.id, title: "Homepage" },
    })

    const deleteRes = await client.links[":id"].$delete(
      { param: { id: link.id } },
      withAuth(user.id),
    )
    expect(deleteRes.status).toBe(200)
    expect(await deleteRes.json()).toEqual({ ok: true })
  })

  it("returns 404 for an unknown link", async () => {
    const { user } = await createProfileForAccount()
    const res = await client.links[":id"].$delete(
      { param: { id: "missing-link-id" } },
      withAuth(user.id),
    )
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "Not found" })
  })
})
