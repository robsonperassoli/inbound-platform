import type { InferResponseType } from "hono/client"
import { ApiError, client } from "./client"

export type InvitationByToken = InferResponseType<
  (typeof client.invitations)[":token"]["$get"]
>

export async function getInvitationByToken(token: string) {
  const res = await client.invitations[":token"].$get({ param: { token } })
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}

export async function acceptInvitation(token: string) {
  const res = await client.invitations[":token"].accept.$post({
    param: { token },
  })
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}
