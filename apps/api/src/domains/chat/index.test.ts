import { beforeEach, describe, expect, it, vi } from "vitest"
import * as forms from "../forms/index"
import * as chat from "./index"
import {
  createFormForAccount,
  createProfileForAccount,
  createUserAccount,
} from "../../test/factories"

vi.mock("./agents.ts", () => ({
  runFormSubmissionAgent: vi.fn(async () => undefined),
}))

import { runFormSubmissionAgent } from "./agents"

describe("chat domain", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("builds a greeting that includes the profile title", () => {
    expect(chat.greetingMessage("Acme")).toContain("Acme")
  })

  it("starts a form session with a greeting message", async () => {
    const { user, profile } = await createProfileForAccount({
      username: "chat-page",
      title: "Chat Page",
    })
    const { form } = await createFormForAccount({
      userId: user.id,
      title: "Lead Capture",
    })

    const sessionId = await chat.startFormSession({
      profileId: profile.id,
      formId: form.id,
    })

    const messages = await chat.getFormSessionMessages(sessionId)
    expect(messages).toHaveLength(1)
    expect(messages[0]).toMatchObject({
      role: "assistant",
      status: "complete",
      content: chat.greetingMessage("Chat Page"),
    })

    const thread = await chat.getThreadById(sessionId)
    expect(thread).toMatchObject({
      type: "formSubmission",
      formId: form.id,
      profileId: profile.id,
      userId: user.id,
    })
  })

  it("persists user messages and triggers the agent without awaiting it", async () => {
    const { user, profile } = await createProfileForAccount({
      username: "agent-page",
      title: "Agent Page",
    })
    const { form } = await createFormForAccount({ userId: user.id })
    const sessionId = await chat.startFormSession({
      profileId: profile.id,
      formId: form.id,
    })

    const result = await chat.sendFormSessionMessage({
      sessionId,
      message: "Hello Hugo",
    })

    expect(result).toEqual({ ok: true })
    expect(runFormSubmissionAgent).toHaveBeenCalledWith(sessionId)

    const messages = await chat.getFormSessionMessages(sessionId)
    expect(messages).toHaveLength(2)
    expect(messages[1]).toMatchObject({
      role: "user",
      content: "Hello Hugo",
      status: "complete",
    })
  })

  it("scopes dashboard threads to the owning user", async () => {
    const owner = await createUserAccount()
    const other = await createUserAccount()

    const threadId = await chat.startThemeDesignerThread({
      userId: owner.user.id,
      profileId: "profile_unused",
    })

    await expect(
      chat.getThreadForUser(threadId, other.user.id),
    ).resolves.toBeNull()

    const owned = await chat.getThreadWithMessages(threadId, owner.user.id)
    expect(owned?.thread.id).toBe(threadId)
    expect(owned?.messages).toHaveLength(1)
    expect(owned?.messages[0]?.role).toBe("assistant")
  })

  it("links submissions and forms to threads and ends sessions", async () => {
    const { user, profile } = await createProfileForAccount({
      username: "link-page",
    })
    const { form } = await createFormForAccount({ userId: user.id })
    const sessionId = await chat.startFormSession({
      profileId: profile.id,
      formId: form.id,
    })

    const submission = await forms.ensureSubmissionForThread({
      threadId: sessionId,
      userId: user.id,
      formId: form.id,
      formSubmissionId: null,
    })

    await chat.linkFormSubmissionToThread(sessionId, submission.id)
    await chat.linkFormToThread(sessionId, form.id)
    await chat.endFormSession(sessionId)

    const thread = await chat.getThreadById(sessionId)
    expect(thread).toMatchObject({
      formSubmissionId: submission.id,
      formId: form.id,
    })
    expect(thread?.sessionEndedAt).toEqual(expect.any(Number))

    const transcript = await chat.getSubmissionTranscript(submission.id)
    expect(transcript).toHaveLength(1)
    expect(transcript[0]?.role).toBe("assistant")
  })

  it("starts form builder threads", async () => {
    const { user } = await createUserAccount()
    const threadId = await chat.startFormBuilderThread({
      userId: user.id,
    })

    const thread = await chat.getThreadWithMessages(threadId, user.id)
    expect(thread?.thread.type).toBe("formBuilder")
    expect(thread?.messages[0]?.content).toContain("form")
  })
})
