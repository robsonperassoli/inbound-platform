import { api } from "./client"

export type ThreadMessage = {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  createdAt: number
  status?: "pending" | "complete" | "streaming" | "error"
}

export function startThemeDesigner(profileId: string) {
  return api<{ threadId: string }>("/threads/theme-designer", {
    method: "POST",
    body: JSON.stringify({ profileId }),
  })
}

export function startFormBuilder(profileId?: string) {
  return api<{ threadId: string }>("/threads/form-builder", {
    method: "POST",
    body: JSON.stringify({ profileId }),
  })
}

export function getThreadMessages(threadId: string) {
  return api<{
    thread: {
      id: string
      type: "formSubmission" | "formBuilder" | "themeDesigner"
      formId: string | null
      profileId: string | null
    }
    messages: ThreadMessage[]
  }>(`/threads/${threadId}/messages`)
}

export function sendThreadMessage(threadId: string, message: string) {
  return api<{ ok: true }>(`/threads/${threadId}/messages`, {
    method: "POST",
    body: JSON.stringify({ message }),
  })
}
