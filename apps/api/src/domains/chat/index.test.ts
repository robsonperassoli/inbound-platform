import { beforeEach, describe, expect, it, vi } from "vitest"
import * as forms from "../forms/index"
import * as chat from "./index"
import {
  createFormForAccount,
  createProfileForAccount,
  createUserAccount,
} from "../../test/factories"

describe("chat domain", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("creates threads and messages as persistence primitives", async () => {
    const { user, profile } = await createProfileForAccount({
      username: "chat-page",
      title: "Chat Page",
    })
    const { form } = await createFormForAccount({
      userId: user.id,
      title: "Lead Capture",
    })

    const thread = await chat.createThread({
      userId: user.id,
      title: `${form.title} Form Session`,
      systemPrompt: "test prompt",
      type: "formSubmission",
      formId: form.id,
      profileId: profile.id,
    })

    await chat.createMessage({
      threadId: thread.id,
      role: "assistant",
      content: "Hello",
      status: "complete",
    })

    const messages = await chat.getFormSessionMessages(thread.id)
    expect(messages).toHaveLength(1)
    expect(messages[0]).toMatchObject({
      role: "assistant",
      status: "complete",
      content: "Hello",
    })

    const loaded = await chat.getThreadById(thread.id)
    expect(loaded).toMatchObject({
      type: "formSubmission",
      formId: form.id,
      profileId: profile.id,
      userId: user.id,
    })
  })

  it("scopes dashboard threads to the owning user", async () => {
    const owner = await createUserAccount()
    const other = await createUserAccount()

    const thread = await chat.createThread({
      userId: owner.user.id,
      title: "Theme Designer",
      systemPrompt: "test",
      type: "themeDesigner",
      profileId: "profile_unused",
    })

    await chat.createMessage({
      threadId: thread.id,
      role: "assistant",
      content: "Hi",
      status: "complete",
    })

    await expect(
      chat.getThreadForUser(thread.id, other.user.id),
    ).resolves.toBeNull()

    const owned = await chat.getThreadWithMessages(thread.id, owner.user.id)
    expect(owned?.thread.id).toBe(thread.id)
    expect(owned?.messages).toHaveLength(1)
    expect(owned?.messages[0]?.role).toBe("assistant")
  })

  it("links submissions and forms to threads and ends sessions", async () => {
    const { user, profile } = await createProfileForAccount({
      username: "link-page",
    })
    const { form } = await createFormForAccount({ userId: user.id })

    const thread = await chat.createThread({
      userId: user.id,
      title: "Session",
      systemPrompt: "test",
      type: "formSubmission",
      formId: form.id,
      profileId: profile.id,
    })

    await chat.createMessage({
      threadId: thread.id,
      role: "assistant",
      content: "Hi",
      status: "complete",
    })

    const submission = await forms.ensureSubmissionForThread({
      threadId: thread.id,
      userId: user.id,
      formId: form.id,
      formSubmissionId: null,
    })

    await chat.linkFormSubmissionToThread(thread.id, submission.id)
    await chat.linkFormToThread(thread.id, form.id)
    await chat.endFormSession(thread.id)

    const loaded = await chat.getThreadById(thread.id)
    expect(loaded).toMatchObject({
      formSubmissionId: submission.id,
      formId: form.id,
    })
    expect(loaded?.sessionEndedAt).toEqual(expect.any(Number))

    const transcript = await chat.getSubmissionTranscript(submission.id)
    expect(transcript).toHaveLength(1)
    expect(transcript[0]?.role).toBe("assistant")
  })
})
