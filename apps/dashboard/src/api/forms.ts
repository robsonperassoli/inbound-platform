import type { InferRequestType, InferResponseType } from "hono/client"
import { ApiError, client } from "./client"

export type FormSubmission = InferResponseType<
  (typeof client.forms)[":id"]["submissions"]["$get"],
  200
>["submissions"][number]

export async function listForms() {
  const res = await client.forms.$get()
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}

export async function getForm(id: string) {
  const res = await client.forms[":id"].$get({ param: { id } })
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}

export async function createForm(
  body: InferRequestType<typeof client.forms.$post>["json"],
) {
  const res = await client.forms.$post({ json: body })
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}

export type UpdateFormBody = InferRequestType<
  (typeof client.forms)[":id"]["$patch"]
>["json"]

export async function updateForm(id: string, body: UpdateFormBody) {
  const res = await client.forms[":id"].$patch({
    param: { id },
    json: body,
  })
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}

export async function updateFormFields(
  id: string,
  fields: NonNullable<UpdateFormBody["fields"]>,
) {
  return updateForm(id, { fields })
}

export async function listSubmissions(formId: string) {
  const res = await client.forms[":id"].submissions.$get({
    param: { id: formId },
  })
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}

export async function getSubmissionTranscript(
  formId: string,
  submissionId: string,
) {
  const res = await client.forms[":id"].submissions[":submissionId"].transcript.$get(
    {
      param: { id: formId, submissionId },
    },
  )
  if (!res.ok) {
    throw new ApiError(res.status, (await res.text()) || res.statusText)
  }
  return res.json()
}
