import type { Session } from "@/lib/types"
import { api } from "./client"

export function getSession() {
  return api<Session>("/me")
}

export function logout() {
  return api<{ ok: true }>("/auth/logout", {
    method: "POST",
    body: "{}",
  })
}
