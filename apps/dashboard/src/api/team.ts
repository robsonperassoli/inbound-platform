import { api } from "./client"

export type TeamMember = {
  membershipId: string
  userId: string
  email: string
  name: string
  role: "owner" | "admin" | "member"
  profiles: string[]
  joinedAt: number
}

export type TeamInvitation = {
  invitationId: string
  email: string
  role: "owner" | "admin" | "member"
  profiles: string[]
  expiresAt: number
  invitedByName: string
}

export type TeamProfile = {
  id: string
  title: string
  username: string
}

export function listTeamMembers() {
  return api<{ members: TeamMember[] }>("/team/members")
}

export function listTeamInvitations() {
  return api<{ invitations: TeamInvitation[] }>("/team/invitations")
}

export function listTeamProfiles() {
  return api<{ profiles: TeamProfile[] }>("/team/profiles")
}

export function createTeamInvitation(body: {
  email: string
  role: "admin" | "member" | "owner"
  profiles: string[]
}) {
  return api<{ invitationId: string; token: string; expiresAt: number }>(
    "/team/invitations",
    { method: "POST", body: JSON.stringify(body) },
  )
}

export function resendTeamInvitation(invitationId: string) {
  return api<{ invitationId: string; token: string; expiresAt: number }>(
    `/team/invitations/${invitationId}/resend`,
    { method: "POST", body: "{}" },
  )
}

export function revokeTeamInvitation(invitationId: string) {
  return api<{ ok: true }>(`/team/invitations/${invitationId}`, {
    method: "DELETE",
  })
}

export function updateTeamMemberPermissions(
  membershipId: string,
  body: { profiles: string[] },
) {
  return api<{ ok: true }>(`/team/members/${membershipId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}
