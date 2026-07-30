import { describe, expect, it } from "vitest"
import { client } from "../../test/http"

describe("workos webhook", () => {
  it("accepts the scaffold endpoint", async () => {
    const res = await client.webhooks.workos.$post()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, received: true })
  })
})
