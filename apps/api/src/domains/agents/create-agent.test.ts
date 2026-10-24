import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("ai", () => ({
  ToolLoopAgent: vi.fn(function ToolLoopAgent(
    this: { settings: unknown },
    settings: unknown,
  ) {
    this.settings = settings
  }),
  stepCountIs: vi.fn((count: number) => ({ steps: count })),
}))

vi.mock("./index.ts", () => ({
  model: { modelId: "mock-model" },
}))

vi.mock("./tools.ts", () => ({
  createFillFormTool: vi.fn((threadId: string) => ({ fillForm: threadId })),
  createSubmitFormTool: vi.fn((threadId: string) => ({ submitForm: threadId })),
  createListFormsTool: vi.fn((userId: string) => ({ listForms: userId })),
  createCreateFormTool: vi.fn(
    (userId: string, threadId: string, profileId?: string | null) => ({
      createForm: { userId, threadId, profileId },
    }),
  ),
  createUpdateFormTool: vi.fn((userId: string, threadId: string) => ({
    updateForm: { userId, threadId },
  })),
  createUpdateThemeTool: vi.fn((profileId: string) => ({
    updateTheme: profileId,
  })),
}))

import { stepCountIs, ToolLoopAgent } from "ai"
import type { getThreadById } from "../chat/index"
import { createAgent } from "./create-agent"
import { model } from "./index"
import * as tools from "./tools"

type Thread = NonNullable<Awaited<ReturnType<typeof getThreadById>>>

function thread(overrides: Partial<Thread> = {}): Thread {
  return {
    id: "thread_1",
    userId: "user_1",
    title: "Thread",
    model: "gpt-4o-mini",
    systemPrompt: "Follow the brief.",
    type: "formBuilder",
    formId: null,
    formSubmissionId: null,
    profileId: "profile_1",
    sessionEndedAt: null,
    lastUserMessageAt: null,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

function settingsOf(agent: unknown) {
  return (agent as { settings: Record<string, unknown> }).settings
}

describe("createAgent", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("gives a form submission thread fill and submit tools", () => {
    const current = thread({ type: "formSubmission", profileId: null })
    const agent = createAgent(current)

    expect(tools.createFillFormTool).toHaveBeenCalledWith("thread_1")
    expect(tools.createSubmitFormTool).toHaveBeenCalledWith("thread_1")
    expect(settingsOf(agent)).toMatchObject({
      model,
      instructions: "Follow the brief.",
      tools: {
        fillForm: { fillForm: "thread_1" },
        submitForm: { submitForm: "thread_1" },
      },
      stopWhen: [{ steps: 20 }],
    })
    expect(stepCountIs).toHaveBeenCalledWith(20)
    expect(ToolLoopAgent).toHaveBeenCalledTimes(1)
  })

  it("gives a form builder thread list, create, and update tools", () => {
    const current = thread({ type: "formBuilder" })
    const agent = createAgent(current)

    expect(tools.createListFormsTool).toHaveBeenCalledWith("user_1")
    expect(tools.createCreateFormTool).toHaveBeenCalledWith(
      "user_1",
      "thread_1",
      "profile_1",
    )
    expect(tools.createUpdateFormTool).toHaveBeenCalledWith(
      "user_1",
      "thread_1",
    )
    expect(settingsOf(agent).tools).toMatchObject({
      listForms: { listForms: "user_1" },
      createForm: {
        createForm: {
          userId: "user_1",
          threadId: "thread_1",
          profileId: "profile_1",
        },
      },
      updateForm: { updateForm: { userId: "user_1", threadId: "thread_1" } },
    })
  })

  it("gives a theme designer thread the updateTheme tool", () => {
    const agent = createAgent(thread({ type: "themeDesigner" }))

    expect(tools.createUpdateThemeTool).toHaveBeenCalledWith("profile_1")
    expect(settingsOf(agent).tools).toEqual({
      updateTheme: { updateTheme: "profile_1" },
    })
  })

  it("refuses a theme designer thread without a profile", () => {
    expect(() =>
      createAgent(thread({ type: "themeDesigner", profileId: null })),
    ).toThrow(/missing profileId/)
    expect(ToolLoopAgent).not.toHaveBeenCalled()
  })

  it("refuses an unknown thread type", () => {
    expect(() =>
      createAgent(thread({ type: "other" as Thread["type"] })),
    ).toThrow(/Unknown agent type/)
  })
})
