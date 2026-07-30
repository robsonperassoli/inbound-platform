import { describe, expect, it } from "vitest"
import { createUserAccount } from "../test/factories"
import { client, withAuth } from "../test/http"

describe("users routes", () => {
  it("returns health", async () => {
    const res = await client.health.$get()
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({
      ok: true,
      service: "api",
    })
  })

  it("returns 401 for /me without a session", async () => {
    const res = await client.me.$get()
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: "Unauthorized" })
  })

  it("returns the current session shape for /me", async () => {
    const { user } = await createUserAccount()
    const res = await client.me.$get({}, withAuth(user.id))
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({
      user: { id: user.id },
      account: { id: expect.any(String) },
      membership: { role: expect.any(String) },
      subscribed: expect.any(Boolean),
      plan: expect.any(String),
      isSuperUser: false,
    })
  })

  it("forbids /system/users for non-superusers", async () => {
    const { user } = await createUserAccount()
    const res = await client.system.users.$get({}, withAuth(user.id))
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: "Forbidden" })
  })
})
