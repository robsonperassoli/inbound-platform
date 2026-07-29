import { asc, eq } from "drizzle-orm"
import { createId } from "@inbound/shared"
import { db } from "../../db/client.ts"
import { messages, threads } from "../../db/schema.ts"

export async function getThreadById(id: string) {
  return db.query.threads.findFirst({ where: eq(threads.id, id) })
}

export async function getThreadByFormSubmissionId(formSubmissionId: string) {
  return db.query.threads.findFirst({
    where: eq(threads.formSubmissionId, formSubmissionId),
  })
}

export async function createThread(input: {
  id?: string
  userId: string
  title: string
  model?: string
  systemPrompt: string
  type: "formSubmission" | "formBuilder" | "themeDesigner"
  formId?: string | null
  formSubmissionId?: string | null
  profileId?: string | null
  createdAt?: number
  updatedAt?: number
}) {
  const id = input.id ?? createId()
  const now = Date.now()
  await db.insert(threads).values({
    id,
    userId: input.userId,
    title: input.title,
    model: input.model ?? "gpt-4o-mini",
    systemPrompt: input.systemPrompt,
    type: input.type,
    formId: input.formId ?? null,
    formSubmissionId: input.formSubmissionId ?? null,
    profileId: input.profileId ?? null,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
  })
  return (await getThreadById(id))!
}

export async function updateThread(
  id: string,
  patch: {
    formId?: string | null
    formSubmissionId?: string | null
    sessionEndedAt?: number | null
    lastUserMessageAt?: number | null
    updatedAt?: number
  },
) {
  await db
    .update(threads)
    .set({ ...patch, updatedAt: patch.updatedAt ?? Date.now() })
    .where(eq(threads.id, id))
  return getThreadById(id)
}

export async function listMessagesByThread(threadId: string) {
  return db.query.messages.findMany({
    where: eq(messages.threadId, threadId),
    orderBy: [asc(messages.createdAt)],
  })
}

export async function getMessageById(id: string) {
  return db.query.messages.findFirst({ where: eq(messages.id, id) })
}

export async function createMessage(input: {
  id?: string
  threadId: string
  role: "user" | "assistant" | "system"
  content: string
  status?: "pending" | "complete" | "streaming" | "error"
  createdAt?: number
}) {
  const id = input.id ?? createId()
  await db.insert(messages).values({
    id,
    threadId: input.threadId,
    role: input.role,
    content: input.content,
    status: input.status ?? "complete",
    createdAt: input.createdAt ?? Date.now(),
  })
  return (await getMessageById(id))!
}

export async function updateMessage(
  id: string,
  patch: {
    content?: string
    status?: "pending" | "complete" | "streaming" | "error"
  },
) {
  await db.update(messages).set(patch).where(eq(messages.id, id))
  return getMessageById(id)
}
