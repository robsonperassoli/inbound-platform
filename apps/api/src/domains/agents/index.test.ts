import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("./execute.ts", () => ({
  runAgent: vi.fn(async () => undefined),
}))

import * as agents from "./index"
import { runAgent } from "./execute"
import * as chat from "../chat/index"
import * as formSubmission from "./form-submission"
import {
  createFormForAccount,
  createProfileForAccount,
  createUserAccount,
} from "../../test/factories"

describe("agents domain", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("builds a greeting that includes the profile title", () => {
    expect(formSubmission.greetingMessage("Acme")).toContain("Acme")
  })

  it("starts a form session with a greeting message", async () => {
    const { user, profile } = await createProfileForAccount({
      username: "agent-chat-page",
      title: "Chat Page",
    })
    const { form } = await createFormForAccount({
      userId: user.id,
      title: "Lead Capture",
    })

    const sessionId = await agents.startFormSession({
      profileId: profile.id,
      formId: form.id,
    })

    const messages = await chat.getFormSessionMessages(sessionId)
    expect(messages).toHaveLength(1)
    expect(messages[0]).toMatchObject({
      role: "assistant",
      status: "complete",
      content: formSubmission.greetingMessage("Chat Page"),
    })

    const thread = await chat.getThreadById(sessionId)
    expect(thread).toMatchObject({
      type: "formSubmission",
      formId: form.id,
      profileId: profile.id,
      userId: user.id,
      systemPrompt: formSubmission.systemPrompt,
    })
  })

  it("persists user + pending assistant messages and triggers the agent", async () => {
    const { user, profile } = await createProfileForAccount({
      username: "agent-page",
      title: "Agent Page",
    })
    const { form } = await createFormForAccount({ userId: user.id })
    const sessionId = await agents.startFormSession({
      profileId: profile.id,
      formId: form.id,
    })

    const result = await agents.sendFormSessionMessage({
      sessionId,
      message: "Hello Hugo",
    })

    expect(result).toEqual({ ok: true })
    expect(runAgent).toHaveBeenCalledWith(sessionId)

    const messages = await chat.getFormSessionMessages(sessionId)
    expect(messages).toHaveLength(3)
    expect(messages[1]).toMatchObject({
      role: "user",
      content: "Hello Hugo",
      status: "complete",
    })
    expect(messages[2]).toMatchObject({
      role: "assistant",
      content: "",
      status: "pending",
    })
  })

  it("starts theme designer and form builder threads", async () => {
    const { user, profile } = await createProfileForAccount({
      username: "designer-page",
    })

    const themeThreadId = await agents.startThemeDesignerThread({
      userId: user.id,
      profileId: profile.id,
    })
    const theme = await chat.getThreadWithMessages(themeThreadId, user.id)
    expect(theme?.thread.type).toBe("themeDesigner")
    expect(theme?.messages[0]?.role).toBe("assistant")

    const owner = await createUserAccount()
    const builderThreadId = await agents.startFormBuilderThread({
      userId: owner.user.id,
    })
    const builder = await chat.getThreadWithMessages(
      builderThreadId,
      owner.user.id,
    )
    expect(builder?.thread.type).toBe("formBuilder")
    expect(builder?.messages[0]?.content).toContain("form")
  })

  it("sends authenticated thread messages with pending assistant replies", async () => {
    const { user, profile } = await createProfileForAccount({
      username: "auth-agent-page",
    })
    const threadId = await agents.startThemeDesignerThread({
      userId: user.id,
      profileId: profile.id,
    })

    await agents.sendThreadMessage({
      threadId,
      message: "Make it dark",
    })

    expect(runAgent).toHaveBeenCalledWith(threadId)
    const data = await chat.getThreadWithMessages(threadId, user.id)
    expect(data?.messages.at(-1)).toMatchObject({
      role: "assistant",
      status: "pending",
    })
  })
})
