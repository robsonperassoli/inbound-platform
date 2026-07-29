import type { InferRequestType } from "hono/client"
import { ApiError, client } from "./client"

export async function startFormSession(
  body: InferRequestType<typeof client.public["form-sessions"]["$post"]>["json"],
) {
  const res = await client.public["form-sessions"].$post({ json: body })
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}

export async function getFormSessionMessages(sessionId: string) {
  const res = await client.public["form-sessions"][":sessionId"].messages.$get({
    param: { sessionId },
  })
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}

export async function sendFormSessionMessage(sessionId: string, message: string) {
  const res = await client.public["form-sessions"][":sessionId"].messages.$post({
    param: { sessionId },
    json: { message },
  })
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}
