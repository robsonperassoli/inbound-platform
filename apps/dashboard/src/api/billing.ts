import { api } from "./client"

export function createCheckout(input: {
  plan: "starter" | "pro"
  cycle: "monthly" | "yearly"
}) {
  return api<{ sessionId: string; url: string | null }>("/billing/checkout", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function createPortal() {
  return api<{ url: string }>("/billing/portal", { method: "POST" })
}
