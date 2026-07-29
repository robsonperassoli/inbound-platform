import type { InferResponseType } from "hono/client"
import { ApiError, client } from "./client"

export type ThreadMessage = InferResponseType<
  (typeof client.threads)[":id"]["messages"]["$get"],
  200
>["messages"][number]

export async function startThemeDesigner(profileId: string) {
  const res = await client.threads["theme-designer"].$post({
    json: { profileId },
  })
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}

export async function startFormBuilder(profileId?: string) {
  const res = await client.threads["form-builder"].$post({
    json: { profileId },
  })
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}

export async function getThreadMessages(threadId: string) {
  const res = await client.threads[":id"].messages.$get({
    param: { id: threadId },
  })
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}

export async function sendThreadMessage(threadId: string, message: string) {
  const res = await client.threads[":id"].messages.$post({
    param: { id: threadId },
    json: { message },
  })
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}
