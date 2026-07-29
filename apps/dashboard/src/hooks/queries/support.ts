import { useMutation } from "@tanstack/react-query"
import { sendFeedback, sendSupport } from "@/api/support"

export function useSendSupport() {
  return useMutation({
    mutationFn: (message: string) => sendSupport(message),
  })
}

export function useSendFeedback() {
  return useMutation({
    mutationFn: (message: string) => sendFeedback(message),
  })
}
