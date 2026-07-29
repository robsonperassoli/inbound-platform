import { api } from "./client"

export type InvitationByToken =
  | {
      status: "valid"
      email: string
      role: "owner" | "admin" | "member"
      invitedByName: string
    }
  | { status: "invalid"; message: string }

export function getInvitationByToken(token: string) {
  return api<InvitationByToken>(`/invitations/${token}`)
}

export function acceptInvitation(token: string) {
  return api<{ ok: true }>(`/invitations/${token}/accept`, {
    method: "POST",
    body: "{}",
  })
}
