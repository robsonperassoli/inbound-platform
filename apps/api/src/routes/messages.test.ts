import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../domains/agents/execute.ts", () => ({
  runAgent: vi.fn(async () => undefined),
}))

import * as agents from "../domains/agents/index"
import { createProfileForAccount } from "../test/factories"
import { client, withAuth } from "../test/http"

describe("messages routes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("lists and posts messages on an owned thread", async () => {
    const { user, profile } = await createProfileForAccount({
      username: "messages-page",
    })
    const threadId = await agents.startThemeDesignerThread({
      userId: user.id,
      profileId: profile.id,
    })

    const listRes = await client.threads[":id"].messages.$get(
      { param: { id: threadId } },
      withAuth(user.id),
    )
    expect(listRes.status).toBe(200)
    if (!listRes.ok) throw new Error(`unexpected status ${listRes.status}`)
    const listed = await listRes.json()
    expect(listed.thread.id).toBe(threadId)
    expect(listed.messages.length).toBeGreaterThan(0)

    const postRes = await client.threads[":id"].messages.$post(
      {
        param: { id: threadId },
        json: { message: "Make it dark" },
      },
      withAuth(user.id),
    )
    expect(postRes.status).toBe(200)
    expect(await postRes.json()).toEqual({ ok: true })
  })
})
