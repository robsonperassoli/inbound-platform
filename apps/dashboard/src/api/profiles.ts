import type { InferRequestType } from "hono/client"
import { ApiError, client } from "./client"

export async function listProfiles() {
  const res = await client.profiles.$get()
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}

export async function checkUsernameAvailability(username: string) {
  const res = await client.profiles["username-available"].$get({
    query: { username },
  })
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}

export async function isUsernameAvailable(username: string) {
  return checkUsernameAvailability(username)
}

export async function getProfile(id: string) {
  const res = await client.profiles[":id"].$get({ param: { id } })
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}

export async function createProfile(
  body: InferRequestType<typeof client.profiles.$post>["json"],
) {
  const res = await client.profiles.$post({ json: body })
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}

export type UpdateProfileBody = InferRequestType<
  (typeof client.profiles)[":id"]["$patch"]
>["json"]

export async function updateProfile(id: string, body: UpdateProfileBody) {
  const res = await client.profiles[":id"].$patch({
    param: { id },
    json: body,
  })
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}

export async function publishProfile(id: string) {
  return updateProfile(id, { publishedAt: Date.now() })
}
