import { openai } from "@ai-sdk/openai"
import { stepCountIs, ToolLoopAgent, type ToolSet } from "ai"
import type { getThreadById } from "../chat/index"
import * as agentTools from "./tools"

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

    default:
      throw new Error(`Unknown agent type: ${(thread as Thread).type}`)
  }

  return new ToolLoopAgent({
    model: openai(thread.model || "gpt-4o-mini"),
    instructions: thread.systemPrompt,
    tools,
    stopWhen: [stepCountIs(20)],
  })
}
