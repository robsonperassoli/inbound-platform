import { describe, expect, it } from "vitest"
import { buildThreadState } from "./state"
import * as agents from "./index"
import * as chat from "../chat/index"
import {
  createFormForAccount,
  createProfileForAccount,
} from "../../test/factories"

describe("agents state", () => {
  it("builds form submission state with definition and collected values", async () => {
    const { user, profile } = await createProfileForAccount({
      username: "state-form-page",
    })
    const { form } = await createFormForAccount({
      userId: user.id,
      title: "State Form",
    })

    const sessionId = await agents.startFormSession({
      profileId: profile.id,
      formId: form.id,
    })
    const thread = await chat.getThreadById(sessionId)
    expect(thread).toBeTruthy()

    const state = await buildThreadState(thread!)
    expect(state).toContain("FORM_DEFINITION:")
    expect(state).toContain("COLLECTED_VALUES:")
  })

  it("builds theme designer state from the current profile theme", async () => {
    const { user, profile } = await createProfileForAccount({
      username: "state-theme-page",
    })
    const threadId = await agents.startThemeDesignerThread({
      userId: user.id,
      profileId: profile.id,
    })
    const thread = await chat.getThreadById(threadId)
    expect(thread).toBeTruthy()

    const state = await buildThreadState(thread!)
    expect(state).toContain("CURRENT_THEME:")
  })

  it("reports missing form definition for new form builder threads", async () => {
    const { user } = await createProfileForAccount({
      username: "state-builder-page",
    })
    const threadId = await agents.startFormBuilderThread({
      userId: user.id,
    })
    const thread = await chat.getThreadById(threadId)
    expect(thread).toBeTruthy()

    const state = await buildThreadState(thread!)
    expect(state).toBe("FORM DEFINITION: Form not created yet")
  })
})
