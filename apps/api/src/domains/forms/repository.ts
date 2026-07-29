import { and, asc, desc, eq } from "drizzle-orm"
import { createId } from "@inbound/shared"
import { db } from "../../db/client"
import { formSubmissions, forms } from "../../db/schema"

type FormField = {
  id: string
  type: string
  label: string
  required: boolean
  options?: string[]
}

export async function getFormById(id: string) {
  return db.query.forms.findFirst({ where: eq(forms.id, id) })
}

export async function listFormsByUser(userId: string) {
  return db.query.forms.findMany({
    where: eq(forms.userId, userId),
    orderBy: [desc(forms.updatedAt)],
  })
}

export async function listFormsByUserOldestFirst(userId: string) {
  return db.query.forms.findMany({
    where: eq(forms.userId, userId),
    orderBy: [asc(forms.createdAt)],
  })
}

export async function createForm(input: {
  id?: string
  userId: string
  title: string
  description?: string | null
  fields?: FormField[]
  publishedAt?: number | null
  createdAt?: number
  updatedAt?: number
}) {
  const id = input.id ?? createId()
  const now = Date.now()
  await db.insert(forms).values({
    id,
    userId: input.userId,
    title: input.title,
    description: input.description ?? null,
    fields: input.fields ?? [],
    publishedAt: input.publishedAt ?? null,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  })
  return (await getFormById(id))!
}

export async function updateForm(
  id: string,
  patch: {
    title?: string
    description?: string | null
    fields?: FormField[]
    publishedAt?: number | null
  },
) {
  await db
    .update(forms)
    .set({ ...patch, updatedAt: Date.now() })
    .where(eq(forms.id, id))
  return getFormById(id)
}

export async function getSubmissionById(id: string) {
  return db.query.formSubmissions.findFirst({
    where: eq(formSubmissions.id, id),
  })
}

export async function listSubmissionsByForm(formId: string) {
  return db.query.formSubmissions.findMany({
    where: eq(formSubmissions.formId, formId),
    orderBy: [desc(formSubmissions.createdAt)],
  })
}

export async function getSubmissionForForm(formId: string, submissionId: string) {
  return db.query.formSubmissions.findFirst({
    where: and(
      eq(formSubmissions.id, submissionId),
      eq(formSubmissions.formId, formId),
    ),
  })
}

export async function createSubmission(input: {
  id?: string
  userId: string
  formId: string
  values?: Record<string, string | number | boolean | string[]>
  createdAt?: number
  updatedAt?: number
}) {
  const id = input.id ?? createId()
  const now = Date.now()
  await db.insert(formSubmissions).values({
    id,
    userId: input.userId,
    formId: input.formId,
    values: input.values ?? {},
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  })
  return (await getSubmissionById(id))!
}

export async function updateSubmissionValues(
  id: string,
  values: Record<string, string | number | boolean | string[]>,
) {
  await db
    .update(formSubmissions)
    .set({ values, updatedAt: Date.now() })
    .where(eq(formSubmissions.id, id))
  return getSubmissionById(id)
}

export async function completeSubmission(id: string) {
  const now = Date.now()
  await db
    .update(formSubmissions)
    .set({ completedAt: now, updatedAt: now })
    .where(eq(formSubmissions.id, id))
  return getSubmissionById(id)
}
