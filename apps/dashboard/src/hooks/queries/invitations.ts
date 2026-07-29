import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { acceptInvitation, getInvitationByToken } from "@/api/invitations"
import { queryKeys } from "./keys"

export function useInvitation(token: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.invitation(token ?? "none"),
    enabled: Boolean(token),
    queryFn: async () => {
      if (!token) throw new Error("Missing invitation token")
      return getInvitationByToken(token)
    },
  })
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (token: string) => acceptInvitation(token),
    onSuccess: async (_data, token) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.invitation(token),
      })
      await queryClient.invalidateQueries({ queryKey: queryKeys.session })
      await queryClient.invalidateQueries({ queryKey: queryKeys.profiles })
    },
  })
}
