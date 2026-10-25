import { Hono } from "hono"
import { describe, expect, it } from "vitest"
import { sqlite } from "../db/client"
import * as accountsRepo from "../domains/accounts/repository"
import { createUserAccount } from "../test/factories"
import { requireAuth, type AuthContext } from "./auth"

const app = new Hono<{ Variables: { auth: AuthContext } }>()
app.use("*", requireAuth)
app.get("/me", (c) => {
  const auth = c.get("auth")
  return c.json({
    userId: auth.user.id,
    accountId: auth.account.id,
    role: auth.membership.role,
  })
})

function withSession(userId: string) {
  return app.request("/me", {
    headers: { cookie: `inbound_session=${userId}` },
  })
}

describe("requireAuth", () => {
  it("rejects a missing or unknown session", async () => {
    const missing = await app.request("/me")
    expect(missing.status).toBe(401)
    expect(await missing.json()).toEqual({ error: "Unauthorized" })

    const unknown = await withSession("missing_user")
    expect(unknown.status).toBe(401)
    expect(await unknown.json()).toEqual({ error: "Unauthorized" })
  })

  it("rejects a user with no membership", async () => {
    const user = await accountsRepo.createUser({
      email: "solo@example.com",
      name: "Solo",
    })

    const res = await withSession(user.id)
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: "No account membership" })
  })

  it("rejects a membership whose account is gone", async () => {
    const user = await accountsRepo.createUser({
      email: "orphan@example.com",
      name: "Orphan",
    })
    const account = await accountsRepo.createAccount({ type: "individual" })
    await accountsRepo.createMembership({
      accountId: account.id,
      userId: user.id,
      role: "owner",
      profiles: ["all"],
    })

    sqlite.pragma("foreign_keys = OFF")
    sqlite.prepare(`DELETE FROM "accounts" WHERE id = ?`).run(account.id)
    sqlite.pragma("foreign_keys = ON")

    const res = await withSession(user.id)
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: "Account not found" })
  })

  it("attaches the user, account, and membership", async () => {
    const { user, account, membership } = await createUserAccount()

    const res = await withSession(user.id)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      userId: user.id,
      accountId: account.id,
      role: membership.role,
    })
  })
})
