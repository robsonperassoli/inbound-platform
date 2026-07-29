import type { InferResponseType } from "hono/client"
import { ApiError, client } from "./client"

export type SystemUser = InferResponseType<
  typeof client.system.users.$get,
  200
>["users"][number]

export async function listSystemUsers() {
  const res = await client.system.users.$get()
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}
