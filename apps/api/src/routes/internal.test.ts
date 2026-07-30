import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../integrations/resend.ts", () => ({
  sendChatCompletedEmail: vi.fn(async () => ({ id: "dev-email" })),
}))

import * as chat from "../domains/chat/index"
import * as forms from "../domains/forms/index"
import {
  createFormForAccount,
  createProfileForAccount,
  createUserAccount,
} from "../test/factories"
import { client } from "../test/http"

const cronAuth = {
  headers: {
    Authorization: "Bearer test-cron-secret",
  },
}

describe("internal cron routes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("rejects missing or wrong bearer", async () => {
    const missing = await client.internal.cron["auto-close-threads"].$post()
    expect(missing.status).toBe(401)

    const wrong = await client.internal.cron["auto-close-threads"].$post(
      {},
      {
        headers: {
          Authorization: "Bearer wrong",
        },
      },
    )
    expect(wrong.status).toBe(401)
  })

  it("auto-closes abandoned threads with a valid bearer", async () => {
    const { user, profile } = await createProfileForAccount({
      username: "cron-silent",
    })
    const { form } = await createFormForAccount({ userId: user.id })
    const now = Date.now()
    const createdAt = now - 2 * 60 * 60 * 1000 - 1

    const thread = await chat.createThread({
      userId: user.id,
      title: "Cron silent",
      systemPrompt: "test",
      type: "formSubmission",
      formId: form.id,
      profileId: profile.id,
      createdAt,
      updatedAt: createdAt,
    })

    const res = await client.internal.cron["auto-close-threads"].$post(
      {},
      cronAuth,
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({
      ok: true,
      closedSilent: expect.any(Number),
      closedAbandoned: expect.any(Number),
    })

    const loaded = await chat.getThreadById(thread.id)
    expect(loaded?.sessionEndedAt).toEqual(expect.any(Number))
  })

  it("closes idle sessions with a valid bearer", async () => {
    const { user, account } = await createUserAccount({
      name: "Grace Hopper",
    })
    const { profile } = await createProfileForAccount({
      userId: user.id,
      accountId: account.id,
      username: "cron-idle",
    })
    const { form } = await createFormForAccount({ userId: user.id })
    const now = Date.now()
    const lastUserMessageAt = now - 25 * 60 * 1000 - 1

    const thread = await chat.createThread({
      userId: user.id,
      title: "Cron idle",
      systemPrompt: "test",
      type: "formSubmission",
      formId: form.id,
      profileId: profile.id,
    })
    const submission = await forms.ensureSubmissionForThread({
      threadId: thread.id,
      userId: user.id,
      formId: form.id,
      formSubmissionId: null,
    })
    await chat.updateThread(thread.id, {
      formSubmissionId: submission.id,
      lastUserMessageAt,
    })

    const res = await client.internal.cron["auto-close-threads"].$post(
      {},
      cronAuth,
    )
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({
      ok: true,
      closedAbandoned: expect.any(Number),
    })
    expect(
      (body as { closedAbandoned: number }).closedAbandoned,
    ).toBeGreaterThanOrEqual(1)

    const loaded = await chat.getThreadById(thread.id)
    expect(loaded?.sessionEndedAt).toEqual(expect.any(Number))
  })
})
