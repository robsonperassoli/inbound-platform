import { useMutation } from "@tanstack/react-query"
import { createCheckout, createPortal } from "@/api/billing"

export function useCreateCheckout() {
  return useMutation({
    mutationFn: createCheckout,
  })
}

export function useCreatePortal() {
  return useMutation({
    mutationFn: createPortal,
  })
}
