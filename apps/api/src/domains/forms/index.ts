import * as repository from "./repository"

type FormField = {
  id: string
  type: string
  label: string
  required: boolean
  options?: string[]
}

export async function listFormsForUser(userId: string) {
  return repository.listFormsByUser(userId)
}

export async function listFormsForAgent(userId: string) {
  const rows = await repository.listFormsByUserOldestFirst(userId)
  return rows.map(({ userId: _userId, ...rest }) => rest)
}

export async function getFormForUser(formId: string, userId: string) {
  const form = await repository.getFormById(formId)
  if (!form || form.userId !== userId) return null
  return form
}

export async function createFormForUser(input: {
  userId: string
  title: string
  description?: string | null
  fields?: FormField[]
}) {
  return repository.createForm({
    userId: input.userId,
    title: input.title,
    description: input.description,
    fields: input.fields,
  })
}

export async function updateFormForUser(
  formId: string,
  userId: string,
  patch: {
    title?: string
    description?: string | null
    fields?: FormField[]
    publishedAt?: number | null
  },
) {
  const existing = await getFormForUser(formId, userId)
  if (!existing) return null
  return repository.updateForm(existing.id, patch)
}

export async function listSubmissionsForUserForm(
  formId: string,
  userId: string,
) {
  const form = await getFormForUser(formId, userId)
  if (!form) return null
  const submissions = await repository.listSubmissionsByForm(form.id)
  return { form, submissions }
}

export async function getSubmissionForUserForm(
  formId: string,
  submissionId: string,
  userId: string,
) {
  const form = await getFormForUser(formId, userId)
  if (!form) return null
  const submission = await repository.getSubmissionForForm(
    formId,
    submissionId,
  )
  if (!submission) return null
  return { form, submission }
}

export async function ensureSubmissionForThread(input: {
  threadId: string
  userId: string
  formId: string
  formSubmissionId: string | null
}) {
  if (input.formSubmissionId) {
    const existing = await repository.getSubmissionById(input.formSubmissionId)
    if (existing) return existing
  }

  return repository.createSubmission({
    userId: input.userId,
    formId: input.formId,
    values: {},
  })
}

export async function mergeSubmissionValues(
  submissionId: string,
  values: Record<string, string | number | boolean | string[]>,
) {
  const submission = await repository.getSubmissionById(submissionId)
  return repository.updateSubmissionValues(submissionId, {
    ...submission?.values,
    ...values,
  })
}

export async function completeSubmission(submissionId: string) {
  return repository.completeSubmission(submissionId)
}

export {
  getFormById,
  createForm as insertForm,
  updateForm,
  getSubmissionById,
} from "./repository"
