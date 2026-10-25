import { env } from "../../lib/env"
import * as chat from "../chat/index"
import { createAgent } from "./create-agent"
import { buildThreadState } from "./state"

export async function runAgent(threadId: string) {
  const thread = await chat.getThreadById(threadId)
  if (!thread) return

  const history = await chat.listMessagesByThread(threadId)
  const lastMessage = history[history.length - 1]
  if (!lastMessage || lastMessage.role !== "assistant") {
    console.error("Agent run aborted: last message is not assistant", threadId)
    return
  }
  if (lastMessage.status !== "pending") {
    console.error("Agent run aborted: last message not pending", threadId)
    return
  }

  if (!env.OPENAI_API_KEY) {
    await chat.updateMessage(lastMessage.id, {
      content:
        "Thanks! (AI is not configured in this environment — your message was saved.)",
      status: "complete",
    })
    return
  }

  try {
    const state = await buildThreadState(thread)
    const agent = createAgent(thread)

    // Exclude the empty pending assistant message from the prompt history
    const promptMessages = history
      .filter((m) => m.role === "user" || m.role === "assistant")
      .filter((m) => !(m.id === lastMessage.id && m.status === "pending"))
      .map((m) => ({
        role: m.role,
        content: m.content,
      }))

    const stateMessage = {
      role: "user" as const,
      content: state,
    }

    // Insert live domain state before the latest user turn
    const index = Math.max(promptMessages.length - 1, 0)
    const messagesWithState = [
      ...promptMessages.slice(0, index),
      stateMessage,
      ...promptMessages.slice(index),
    ]

    const execResult = await agent.generate({
      messages: messagesWithState,
    })

    await chat.updateMessage(lastMessage.id, {
      content: execResult.text || "(done)",
      status: "complete",
    })
  } catch (error) {
    console.error("Agent error", error)
    await chat.updateMessage(lastMessage.id, {
      content: "Sorry, something went wrong. Please try again.",
      status: "error",
    })
  }
}
