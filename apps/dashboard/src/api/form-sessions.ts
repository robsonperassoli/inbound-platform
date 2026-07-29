import type { ThreadMessage } from "./threads"
import { api } from "./client"

export function startFormSession(body: {
  profileId: string
  formId: string
  linkId?: string
}) {
  return api<{ sessionId: string }>("/public/form-sessions", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export function getFormSessionMessages(sessionId: string) {
  return api<{ messages: ThreadMessage[] }>(
    `/public/form-sessions/${sessionId}/messages`,
  )
}

export function sendFormSessionMessage(sessionId: string, message: string) {
  return api<{ ok: true }>(`/public/form-sessions/${sessionId}/messages`, {
    method: "POST",
    body: JSON.stringify({ message }),
  })
}
