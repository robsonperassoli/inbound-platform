import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createForm,
  getForm,
  getSubmissionTranscript,
  listForms,
  listSubmissions,
  updateForm,
  updateFormFields,
  type UpdateFormBody,
} from "@/api/forms"
import type { Form } from "@/lib/types"
import { queryKeys } from "./keys"

export function useForms() {
  return useQuery({
    queryKey: queryKeys.forms,
    queryFn: async () => {
      const { forms } = await listForms()
      return forms
    },
  })
}

export function useForm(
  formId: string | null | undefined,
  options?: { refetchInterval?: number | false },
) {
  return useQuery({
    queryKey: queryKeys.form(formId ?? "none"),
    enabled: Boolean(formId),
    queryFn: async () => {
      if (!formId) throw new Error("Missing form id")
        const result = await getForm(formId)
      return result.form
    },
    refetchInterval: options?.refetchInterval,
  })
}

export function useFormSubmissions(formId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.submissions(formId ?? "none"),
    enabled: Boolean(formId),
    queryFn: async () => {
      if (!formId) throw new Error("Missing form id")
      return (await listSubmissions(formId)).submissions
    },
  })
}

export function useSubmissionTranscript(
  formId: string | null | undefined,
  submissionId: string | null | undefined,
) {
  return useQuery({
    queryKey: queryKeys.transcript(formId ?? "none", submissionId ?? "none"),
    enabled: Boolean(formId && submissionId),
    queryFn: async () => {
      if (!formId || !submissionId) throw new Error("Missing form or submission id")
      return getSubmissionTranscript(formId, submissionId)
    },
  })
}

export function useCreateForm() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createForm,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.forms }),
  })
}

export function useUpdateForm() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: { id: string } & UpdateFormBody) => updateForm(id, body),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.forms })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.form(data.form.id),
      })
    },
  })
}

export function useSaveFormFields() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, fields }: { id: string; fields: Form["fields"] }) =>
      updateFormFields(id, fields),
    onSuccess: (data) =>
      queryClient.invalidateQueries({ queryKey: queryKeys.form(data.form.id) }),
  })
}
