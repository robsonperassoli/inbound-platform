import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getThreadMessages,
  sendThreadMessage,
  startFormBuilder,
  startThemeDesigner,
} from "@/api/threads"
import { queryKeys } from "./keys"

export function useThread(threadId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.thread(threadId ?? "none"),
    enabled: Boolean(threadId),
    queryFn: async () => {
      if (!threadId) throw new Error("Missing thread id")
      return getThreadMessages(threadId)
    },
    refetchInterval: (query) => {
      const messages = query.state.data?.messages
      if (!messages) return false
      return messages.some(
        (m: { status?: string }) =>
          m.status === "streaming" || m.status === "pending",
      )
        ? 500
        : false
    },
  })
}

export function useSendThreadMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      threadId,
      message,
    }: {
      threadId: string
      message: string
    }) => sendThreadMessage(threadId, message),
    onSuccess: async (_data, vars) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.thread(vars.threadId),
      })
    },
  })
}

export function useStartThemeDesigner() {
  return useMutation({
    mutationFn: (profileId: string) => startThemeDesigner(profileId),
  })
}

export function useStartFormBuilder() {
  return useMutation({
    mutationFn: (profileId?: string) => startFormBuilder(profileId),
  })
}
