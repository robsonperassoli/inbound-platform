import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../emails/index.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../emails/index.ts")>()
  return {
    ...actual,
    sendNewConversationEmail: vi.fn(async () => ({ id: "dev-email" })),
    sendChatCompletedEmail: vi.fn(async () => ({ id: "dev-email" })),
    sendActivationEmail: vi.fn(async () => ({ id: "dev-email" })),
  }
})

import {
  sendChatCompletedEmail,
  sendNewConversationEmail,
} from "../emails/index"
import * as chat from "../chat/index"
import {
  createFormForAccount,
  createProfileForAccount,
  createUserAccount,
} from "../../test/factories"
import { createFillFormTool, createSubmitFormTool } from "./tools"

describe("agent form tools emails", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("emails the owner when a conversation starts on first fillForm", async () => {
    const { user, account } = await createUserAccount({
      name: "Alan Turing",
    })
    const { profile } = await createProfileForAccount({
      userId: user.id,
      accountId: account.id,
      username: "fill-email",
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

    const fillForm = createFillFormTool(thread.id)
    await fillForm.execute!(
      { values: [{ fieldId: "email", value: "lead@example.com" }] },
      {} as never,
    )

    expect(sendNewConversationEmail).toHaveBeenCalledTimes(1)
    expect(sendNewConversationEmail).toHaveBeenCalledWith({
      to: user.email,
      firstName: "Alan",
      transcriptUrl: expect.stringContaining(`/forms/${form.id}/submissions/`),
      formSubmissionId: expect.any(String),
    })

    await fillForm.execute!(
      { values: [{ fieldId: "name", value: "Lead" }] },
      {} as never,
    )
    expect(sendNewConversationEmail).toHaveBeenCalledTimes(1)
  })

  it("emails the owner when submitForm finishes the conversation", async () => {
    const { user, account } = await createUserAccount({
      name: "Grace Hopper",
    })
    const { profile } = await createProfileForAccount({
      userId: user.id,
      accountId: account.id,
      username: "submit-email",
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

    const fillForm = createFillFormTool(thread.id)
    await fillForm.execute!(
      { values: [{ fieldId: "email", value: "lead@example.com" }] },
      {} as never,
    )
    const submissionId = (await chat.getThreadById(thread.id))!.formSubmissionId!

    const submitForm = createSubmitFormTool(thread.id)
    await submitForm.execute!({}, {} as never)

    expect(sendChatCompletedEmail).toHaveBeenCalledWith({
      to: user.email,
      firstName: "Grace",
      transcriptUrl: expect.stringContaining(
        `/forms/${form.id}/submissions/${submissionId}/transcript`,
      ),
      formSubmissionId: submissionId,
      status: "finished",
    })
  })
})
