import { describe, expect, it } from "vitest"
import { createUserAccount } from "../test/factories"
import { client, withAuth } from "../test/http"

describe("profiles routes", () => {
  it("returns 401 without a session", async () => {
    const res = await client.profiles.$get()
    expect(res.status).toBe(401)
  })

  it("lists empty profiles for a new account", async () => {
    const { user } = await createUserAccount()
    const res = await client.profiles.$get({}, withAuth(user.id))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ profiles: [] })
  })

  it("creates and fetches a profile", async () => {
    const { user } = await createUserAccount()

    const createRes = await client.profiles.$post(
      {
        json: {
          username: "jane",
          title: "Jane Doe",
          bio: "Hello",
        },
      },
      withAuth(user.id),
    )
    expect(createRes.status).toBe(201)
    if (!createRes.ok) throw new Error(`unexpected status ${createRes.status}`)
    const created = await createRes.json()
    expect(created.profile).toMatchObject({
      username: "jane",
      title: "Jane Doe",
    })

    const getRes = await client.profiles[":id"].$get(
      { param: { id: created.profile.id } },
      withAuth(user.id),
    )
    expect(getRes.status).toBe(200)
    expect(await getRes.json()).toMatchObject({
      profile: { id: created.profile.id, username: "jane" },
      links: [],
    })
  })

  it("checks username availability", async () => {
    const { user } = await createUserAccount()

    const available = await client.profiles["username-available"].$get(
      { query: { username: "available-name" } },
      withAuth(user.id),
    )
    expect(available.status).toBe(200)
    expect(await available.json()).toEqual({ available: true })

    await client.profiles.$post(
      {
        json: {
          username: "available-name",
          title: "Taken",
        },
      },
      withAuth(user.id),
    )

    const taken = await client.profiles["username-available"].$get(
      { query: { username: "available-name" } },
      withAuth(user.id),
    )
    expect(taken.status).toBe(200)
    expect(await taken.json()).toEqual({ available: false })
  })
})
