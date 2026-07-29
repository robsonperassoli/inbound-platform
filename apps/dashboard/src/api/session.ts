import { ApiError, client } from "./client"
import type { Session } from "@/lib/types"

export async function getSession(): Promise<Session> {
  const res = await client.me.$get()
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}

export async function logout() {
  const res = await client.auth.logout.$post()
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}
