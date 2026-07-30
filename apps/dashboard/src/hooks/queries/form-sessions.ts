import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getFormSessionMessages,
  sendFormSessionMessage,
  startFormSession,
} from "@/api/form-sessions"
import { queryKeys } from "./keys"

export function useStartFormSession() {
  return useMutation({
    mutationFn: (input: { profileId: string; formId: string }) =>
      startFormSession(input),
  })
}

export function useFormSessionMessages(sessionId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.formSessionMessages(sessionId ?? "none"),
    enabled: Boolean(sessionId),
    queryFn: async () => {
      if (!sessionId) throw new Error("Missing session id")
      return getFormSessionMessages(sessionId)
    },
    refetchInterval: (query) => {
      const messages = query.state.data?.messages
      if (!messages) return false
      return messages.some(
        (m) => m.status === "streaming" || m.status === "pending",
      )
        ? 500
        : false
    },
  })
}

export function useSendFormSessionMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      sessionId,
      message,
    }: {
      sessionId: string
      message: string
    }) => sendFormSessionMessage(sessionId, message),
    onSuccess: async (_data, vars) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.formSessionMessages(vars.sessionId),
      })
    },
  })
}
