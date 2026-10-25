import { ApiError, client } from "./client"

export async function listSystemUsers() {
  const res = await client.system.users.$get()
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}
