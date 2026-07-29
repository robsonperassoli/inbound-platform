import { api } from "./client"

export function sendSupport(message: string) {
  return api<{ ok: true }>("/support", {
    method: "POST",
    body: JSON.stringify({ message }),
  })
}

export function sendFeedback(message: string) {
  return api<{ ok: true }>("/feedback", {
    method: "POST",
    body: JSON.stringify({ message }),
  })
}
