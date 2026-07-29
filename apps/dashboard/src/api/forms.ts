import type { Form } from "@/lib/types"
import { api } from "./client"

export type FormSubmission = {
  id: string
  formId: string
  values: Record<string, string | number | boolean | null>
  createdAt: number
  completedAt: number | null
}

export function listForms() {
  return api<{ forms: Form[] }>("/forms")
}

export function getForm(id: string) {
  return api<{ form: Form }>(`/forms/${id}`)
}

export function createForm(body: {
  title: string
  description?: string
  fields?: Form["fields"]
}) {
  return api<{ form: Form }>("/forms", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export type UpdateFormBody = Partial<{
  title: string
  description: string | null
  fields: Form["fields"]
  publishedAt: number | null
}>

export function updateForm(id: string, body: UpdateFormBody) {
  return api<{ form: Form }>(`/forms/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export function updateFormFields(id: string, fields: Form["fields"]) {
  return api<{ form: Form }>(`/forms/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ fields }),
  })
}

export function listSubmissions(formId: string) {
  return api<{ submissions: FormSubmission[] }>(`/forms/${formId}/submissions`)
}

export function getSubmissionTranscript(formId: string, submissionId: string) {
  return api<{
    submission: FormSubmission
    messages: Array<{
      id: string
      role: "user" | "assistant" | "system"
      content: string
      createdAt: number
      status: string
    }>
  }>(`/forms/${formId}/submissions/${submissionId}/transcript`)
}
