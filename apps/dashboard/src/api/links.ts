import type { InferRequestType } from "hono/client"
import { ApiError, client } from "./client"

export type CreateLinkBody = InferRequestType<
  (typeof client.profiles)[":id"]["links"]["$post"]
>["json"]

export async function createLink(profileId: string, body: CreateLinkBody) {
  const res = await client.profiles[":id"].links.$post({
    param: { id: profileId },
    json: body,
  })
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}

export type UpdateLinkBody = InferRequestType<
  (typeof client.links)[":id"]["$patch"]
>["json"]

export async function updateLink(id: string, body: UpdateLinkBody) {
  const res = await client.links[":id"].$patch({
    param: { id },
    json: body,
  })
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}

export async function deleteLink(id: string) {
  const res = await client.links[":id"].$delete({ param: { id } })
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}

export async function reorderLinks(profileId: string, linkIds: string[]) {
  const res = await client.profiles[":id"].links.reorder.$post({
    param: { id: profileId },
    json: { linkIds },
  })
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}
