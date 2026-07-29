import type { InferRequestType, InferResponseType } from "hono/client"
import { ApiError, client } from "./client"

export type TeamMember = InferResponseType<
  typeof client.team.members.$get,
  200
>["members"][number]

export type TeamInvitation = InferResponseType<
  typeof client.team.invitations.$get,
  200
>["invitations"][number]

export type TeamProfile = InferResponseType<
  typeof client.team.profiles.$get,
  200
>["profiles"][number]

export async function listTeamMembers() {
  const res = await client.team.members.$get()
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}

export async function listTeamInvitations() {
  const res = await client.team.invitations.$get()
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}

export async function listTeamProfiles() {
  const res = await client.team.profiles.$get()
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}

export async function createTeamInvitation(
  body: InferRequestType<typeof client.team.invitations.$post>["json"],
) {
  const res = await client.team.invitations.$post({ json: body })
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}

export async function resendTeamInvitation(invitationId: string) {
  const res = await client.team.invitations[":id"].resend.$post({
    param: { id: invitationId },
  })
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}

export async function revokeTeamInvitation(invitationId: string) {
  const res = await client.team.invitations[":id"].$delete({
    param: { id: invitationId },
  })
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}

export async function updateTeamMemberPermissions(
  membershipId: string,
  body: InferRequestType<(typeof client.team.members)[":id"]["$patch"]>["json"],
) {
  const res = await client.team.members[":id"].$patch({
    param: { id: membershipId },
    json: body,
  })
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}
