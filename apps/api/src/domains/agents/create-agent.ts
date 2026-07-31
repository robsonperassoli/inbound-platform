import { stepCountIs, ToolLoopAgent, type ToolSet } from "ai"
import type { getThreadById } from "../chat/index"
import * as agentTools from "./tools"
import { model } from "./"

type Thread = NonNullable<Awaited<ReturnType<typeof getThreadById>>>

export function createAgent(thread: Thread) {
  let tools: ToolSet

  switch (thread.type) {
    case "formSubmission":
      tools = {
        fillForm: agentTools.createFillFormTool(thread.id),
        submitForm: agentTools.createSubmitFormTool(thread.id),
      }
      break

    case "formBuilder":
      tools = {
        listForms: agentTools.createListFormsTool(thread.userId),
        createForm: agentTools.createCreateFormTool(
          thread.userId,
          thread.id,
          thread.profileId,
        ),
        updateForm: agentTools.createUpdateFormTool(thread.userId, thread.id),
      }
      break

    case "themeDesigner":
      if (!thread.profileId) {
        throw new Error("Theme designer thread missing profileId")
      }
      tools = {
        updateTheme: agentTools.createUpdateThemeTool(thread.profileId),
      }
      break

    default: {
      thread satisfies never
      throw new Error("Unknown agent type")
    }
  }

  return new ToolLoopAgent({
    model,
    instructions: thread.systemPrompt,
    tools,
    stopWhen: [stepCountIs(20)],
  })
}
