import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createTeamInvitation,
  listTeamInvitations,
  listTeamMembers,
  listTeamProfiles,
  resendTeamInvitation,
  revokeTeamInvitation,
  updateTeamMemberPermissions,
} from "@/api/team"
import { queryKeys } from "./keys"

export function useTeamMembers(enabled = true) {
  return useQuery({
    queryKey: queryKeys.teamMembers,
    enabled,
    queryFn: async () => (await listTeamMembers()).members,
  })
}

export function useTeamInvitations(enabled = true) {
  return useQuery({
    queryKey: queryKeys.teamInvitations,
    enabled,
    queryFn: async () => (await listTeamInvitations()).invitations,
  })
}

export function useTeamProfiles(enabled = true) {
  return useQuery({
    queryKey: queryKeys.teamProfiles,
    enabled,
    queryFn: async () => (await listTeamProfiles()).profiles,
  })
}

export function useCreateTeamInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createTeamInvitation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.teamInvitations,
      })
    },
  })
}

export function useResendTeamInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (invitationId: string) => resendTeamInvitation(invitationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.teamInvitations,
      })
    },
  })
}

export function useRevokeTeamInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (invitationId: string) => revokeTeamInvitation(invitationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.teamInvitations,
      })
    },
  })
}

export function useUpdateTeamMemberPermissions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      membershipId,
      profiles,
    }: {
      membershipId: string
      profiles: string[]
    }) => updateTeamMemberPermissions(membershipId, { profiles }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.teamMembers })
    },
  })
}
