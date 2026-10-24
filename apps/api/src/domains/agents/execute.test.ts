import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("./create-agent.ts", () => ({
  createAgent: vi.fn(),
}))

import * as chat from "../chat/index"
import { createUserAccount } from "../../test/factories"
import { env } from "../../lib/env"
import { createAgent } from "./create-agent"
import { runAgent } from "./execute"

const previousKey = env.OPENAI_API_KEY

async function pendingThread(options?: { withHistory?: boolean }) {
  const { user } = await createUserAccount()
  const thread = await chat.createThread({
    userId: user.id,
    title: "Form Builder",
    systemPrompt: "Build forms.",
    type: "formBuilder",
  })
  const now = Date.now()

  if (options?.withHistory) {
    await chat.createMessage({
      threadId: thread.id,
      role: "user",
      content: "first",
      status: "complete",
      createdAt: now,
    })
    await chat.createMessage({
      threadId: thread.id,
      role: "assistant",
      content: "ack",
      status: "complete",
      createdAt: now + 1,
    })
    await chat.createMessage({
      threadId: thread.id,
      role: "system",
      content: "hidden",
      status: "complete",
      createdAt: now + 2,
    })
  }

  await chat.createMessage({
    threadId: thread.id,
    role: "user",
    content: "make a form",
    status: "complete",
    createdAt: now + 3,
  })
  const pending = await chat.createMessage({
    threadId: thread.id,
    role: "assistant",
    content: "",
    status: "pending",
    createdAt: now + 4,
  })

  return { thread, pending }
}

describe("runAgent", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    env.OPENAI_API_KEY = undefined
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    env.OPENAI_API_KEY = previousKey
    vi.restoreAllMocks()
  })

  it("does nothing when the thread is missing", async () => {
    await expect(runAgent("missing_thread")).resolves.toBeUndefined()
    expect(createAgent).not.toHaveBeenCalled()
  })

  it("aborts unless the latest message is a pending assistant message", async () => {
    const { user } = await createUserAccount()
    const thread = await chat.createThread({
      userId: user.id,
      title: "Form Builder",
      systemPrompt: "Build forms.",
      type: "formBuilder",
    })

    await runAgent(thread.id)
    expect(console.error).toHaveBeenCalledWith(
      "Agent run aborted: last message is not assistant",
      thread.id,
    )

    const userMessage = await chat.createMessage({
      threadId: thread.id,
      role: "user",
      content: "hello",
      status: "complete",
    })
    await runAgent(thread.id)

    await chat.updateMessage(userMessage.id, { status: "complete" })
    const assistant = await chat.createMessage({
      threadId: thread.id,
      role: "assistant",
      content: "already done",
      status: "complete",
    })
    await runAgent(thread.id)

    expect(console.error).toHaveBeenCalledWith(
      "Agent run aborted: last message not pending",
      thread.id,
    )
    expect(createAgent).not.toHaveBeenCalled()
    const saved = await chat.listMessagesByThread(thread.id)
    expect(saved.at(-1)?.id).toBe(assistant.id)
    expect(saved.at(-1)?.content).toBe("already done")
  })

  it("completes with a local note when OpenAI is not configured", async () => {
    const { pending } = await pendingThread()

    await runAgent(pending.threadId)

    const saved = await chat.listMessagesByThread(pending.threadId)
    expect(saved.at(-1)).toMatchObject({
      id: pending.id,
      status: "complete",
      content: expect.stringContaining("AI is not configured"),
    })
    expect(createAgent).not.toHaveBeenCalled()
  })

  it("inserts live state before the latest user turn and stores the reply", async () => {
    env.OPENAI_API_KEY = "sk_test"
    const generate = vi.fn(async () => ({ text: "Here is a form." }))
    vi.mocked(createAgent).mockReturnValue({ generate } as never)
    const { thread, pending } = await pendingThread({ withHistory: true })

    await runAgent(thread.id)

    expect(createAgent).toHaveBeenCalledWith(
      expect.objectContaining({ id: thread.id, type: "formBuilder" }),
    )
    expect(generate).toHaveBeenCalledWith({
      messages: [
        { role: "user", content: "first" },
        { role: "assistant", content: "ack" },
        { role: "user", content: "FORM DEFINITION: Form not created yet" },
        { role: "user", content: "make a form" },
      ],
    })
    const saved = await chat.listMessagesByThread(thread.id)
    expect(saved.at(-1)).toMatchObject({
      id: pending.id,
      status: "complete",
      content: "Here is a form.",
    })
  })

  it("stores a fallback when the model returns an empty reply", async () => {
    env.OPENAI_API_KEY = "sk_test"
    vi.mocked(createAgent).mockReturnValue({
      generate: vi.fn(async () => ({ text: "" })),
    } as never)
    const { thread, pending } = await pendingThread()

    await runAgent(thread.id)

    const saved = await chat.listMessagesByThread(thread.id)
    expect(saved.find((message) => message.id === pending.id)).toMatchObject({
      status: "complete",
      content: "(done)",
    })
  })

  it("marks the pending message as an error when generation throws", async () => {
    env.OPENAI_API_KEY = "sk_test"
    vi.mocked(createAgent).mockReturnValue({
      generate: vi.fn(async () => {
        throw new Error("model down")
      }),
    } as never)
    const { thread, pending } = await pendingThread()

    await runAgent(thread.id)

    const saved = await chat.listMessagesByThread(thread.id)
    expect(saved.find((message) => message.id === pending.id)).toMatchObject({
      status: "error",
      content: "Sorry, something went wrong. Please try again.",
    })
    expect(console.error).toHaveBeenCalledWith("Agent error", expect.any(Error))
  })
})
